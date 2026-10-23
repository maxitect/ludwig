import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import {
  attempts,
  kakuroAttemptCells,
  kakuroAttempts,
  kakuroCells,
  kakuroPuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { check } from "./check";
import { content, payload, solution } from "./fixture";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { kakuroModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('kak-test', 'kak', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('kakuro', 'kak-test', 'kak', 'kak', 'kakuro_puzzles', 1),
           ('other', 'kak-test', 'other', 'other', 'zz_other_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey: string, slug = "t095-one") {
  await ensureTypes(tx);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

async function insertKakuro(tx: Tx, rows = 5, cols = 5) {
  const puzzleId = await insertPuzzle(tx, "kakuro");
  await tx.insert(kakuroPuzzles).values({ puzzleId, rows, cols });
  return puzzleId;
}

describe("kakuro_puzzles integrity", () => {
  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(kakuroPuzzles).values({ puzzleId, rows: 5, cols: 5 });
      }),
    ).toBe("23503");
  });

  it("rejects a kakuro puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "kakuro");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in kakuro_puzzles/);
  });

  it("accepts a valid puzzle with a cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKakuro(tx);
        await tx
          .insert(kakuroCells)
          .values({ puzzleId, row: 1, col: 1, digit: 9 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["rows 4", 4, 5],
    ["rows 15", 15, 5],
    ["cols 4", 5, 4],
    ["cols 15", 5, 15],
  ])("rejects %s", async (_label, rows, cols) => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertKakuro(tx, rows, cols);
      }),
    ).toBe("23514");
  });
});

describe("kakuro_cells integrity", () => {
  it.each([
    ["digit 0", { digit: 0 }],
    ["digit 10", { digit: 10 }],
    ["row 14", { row: 14 }],
    ["row -1", { row: -1 }],
    ["col 14", { col: 14 }],
    ["col -1", { col: -1 }],
  ])("rejects a cell with %s", async (_label, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKakuro(tx);
        await tx
          .insert(kakuroCells)
          .values({ puzzleId, row: 1, col: 1, digit: 5, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects two digits on one cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertKakuro(tx);
        await tx.insert(kakuroCells).values([
          { puzzleId, row: 1, col: 1, digit: 1 },
          { puzzleId, row: 1, col: 1, digit: 2 },
        ]);
      }),
    ).toBe("23505");
  });

  it("rejects a cell for a puzzle with no kakuro subtype row", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(kakuroCells)
          .values({ puzzleId, row: 1, col: 1, digit: 1 });
      }),
    ).toBe("23503");
  });
});

describe("kakuro module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];
  const upsert = (next: typeof content) =>
    db.transaction((tx) => kakuroModule.upsertContent(tx, puzzleId, next));

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "kak-test", name: "kak", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "kakuro",
        categoryKey: "kak-test",
        name: "kak",
        description: "kak",
        subtypeTable: "kakuro_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "kakuro",
          slug: "t095-module",
          title: "t095",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await kakuroModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t095mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't095-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads cells and derived clues and never a digit", async () => {
    const loaded = await load(puzzleId);
    expect(payloadSchema.strict().parse(loaded)).toEqual(loaded);
    expect(Object.keys(loaded).sort()).toEqual(["cells", "clues", "cols", "rows"]);
    expect(loaded.clues).toEqual(payload.clues);
    expect(JSON.stringify(loaded)).not.toContain("digit");
    expect(
      payloadSchema.strict().safeParse({ ...loaded, cells: solution }).success,
    ).toBe(false);
  });

  it("loads the stored digits for checking", async () => {
    const [loaded, stored] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(stored).toEqual(expect.arrayContaining(solution));
    expect(check(loaded, stored, { cells: stored }).correct).toBe(true);
  });

  it("re-seeding changed content updates in place and removes dropped cells", async () => {
    const [dropped, ...rest] = content.cells;
    await upsert({
      ...content,
      cells: [{ ...rest[0], digit: 9 }, ...rest.slice(1)],
    });
    const rows = await db
      .select({
        row: kakuroCells.row,
        col: kakuroCells.col,
        digit: kakuroCells.digit,
      })
      .from(kakuroCells)
      .where(eq(kakuroCells.puzzleId, puzzleId));
    expect(rows).toHaveLength(content.cells.length - 1);
    expect(rows).not.toContainEqual(dropped);
    expect(rows).toContainEqual({ ...rest[0], digit: 9 });
    await upsert(content);
    expect(await loadSolution(puzzleId)).toEqual(
      expect.arrayContaining(content.cells),
    );
  });

  it("replaces, reads back and clears digits", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await kakuroModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      kakuroModule.replaceAttemptState(tx, attempt.id, {
        cells: [{ row: 1, col: 1, digit: 4 }],
      }),
    );
    await db.transaction((tx) =>
      kakuroModule.replaceAttemptState(tx, attempt.id, {
        cells: [
          { row: 1, col: 1, digit: 4 },
          { row: 1, col: 2, digit: 3 },
        ],
      }),
    );
    const state = await kakuroModule.loadAttemptState(attempt.id);
    expect(state?.cells).toHaveLength(2);

    await kakuroModule.clearAttemptState(attempt.id);
    expect(await kakuroModule.loadAttemptState(attempt.id)).toBeNull();
  });

  describe("attempt tables", () => {
    async function startAttempt(tx: Tx) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(kakuroAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    it.each([
      ["digit 0", { digit: 0 }],
      ["digit 10", { digit: 10 }],
      ["row 14", { row: 14 }],
      ["col -1", { col: -1 }],
    ])("rejects an attempt cell with %s", async (_label, override) => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(kakuroAttemptCells)
            .values({ attemptId, row: 1, col: 1, digit: 5, ...override });
        }),
      ).toBe("23514");
    });

    it("rejects a duplicate attempt cell", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(kakuroAttemptCells).values([
            { attemptId, row: 1, col: 1, digit: 1 },
            { attemptId, row: 1, col: 1, digit: 2 },
          ]);
        }),
      ).toBe("23505");
    });

    it("rejects an attempt subtype row for a puzzle of another type, and cascades on delete", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const otherId = await insertPuzzle(tx, "other", "t095-other");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: otherId })
            .returning({ id: attempts.id });
          await tx.insert(kakuroAttempts).values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(kakuroAttemptCells)
            .values({ attemptId, row: 1, col: 1, digit: 1 });
          await tx.delete(attempts).where(eq(attempts.id, attemptId));
          const left = await tx
            .select()
            .from(kakuroAttemptCells)
            .where(eq(kakuroAttemptCells.attemptId, attemptId));
          if (left.length) throw new Error("cells were not cascaded");
        }),
      ).toBeUndefined();
    });
  });
});
