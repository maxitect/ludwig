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
  puzzleCategories,
  puzzleTypes,
  puzzles,
  fillominoAttemptCells,
  fillominoAttempts,
  fillominoGivens,
  fillominoPuzzles,
} from "@/db/schema";
import { check } from "./check";
import { payload, solution } from "./fixture";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { fillominoModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('fil-test', 'fil', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('fillomino', 'fil-test', 'fil', 'fil', 'fillomino_puzzles', 1),
           ('other', 'fil-test', 'other', 'other', 'zz_other_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey: string, slug = "one") {
  await ensureTypes(tx);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

async function insertFillomino(tx: Tx, rows = 6, cols = 6) {
  const puzzleId = await insertPuzzle(tx, "fillomino");
  await tx.insert(fillominoPuzzles).values({ puzzleId, rows, cols });
  return puzzleId;
}

describe("fillomino_puzzles integrity", () => {
  it("stores no solution column and no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name, data_type from information_schema.columns
      where table_name like 'fillomino%'
        and (column_name like '%solution%' or data_type in ('jsonb', 'json', 'ARRAY'))
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(fillominoPuzzles)
          .values({ puzzleId, rows: 6, cols: 6 });
      }),
    ).toBe("23503");
  });

  it("rejects a fillomino puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "fillomino");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in fillomino_puzzles/);
  });

  it.each([5, 12])("accepts a side of %i with a given", async (side) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFillomino(tx, side, side);
        await tx
          .insert(fillominoGivens)
          .values({ puzzleId, row: 0, col: 0, digit: 1 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["4 rows", 4, 6],
    ["13 rows", 13, 6],
    ["4 cols", 6, 4],
    ["13 cols", 6, 13],
  ])("rejects a puzzle with %s", async (_label, rows, cols) => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertFillomino(tx, rows, cols);
      }),
    ).toBe("23514");
  });

  it.each([
    ["row 12", { row: 12 }],
    ["row -1", { row: -1 }],
    ["col 12", { col: 12 }],
    ["col -1", { col: -1 }],
    ["digit 0", { digit: 0 }],
    ["digit 10", { digit: 10 }],
  ])("rejects a given with %s", async (_label, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFillomino(tx, 12, 12);
        await tx
          .insert(fillominoGivens)
          .values({ puzzleId, row: 0, col: 0, digit: 1, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects two givens on one cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertFillomino(tx);
        await tx.insert(fillominoGivens).values([
          { puzzleId, row: 4, col: 4, digit: 1 },
          { puzzleId, row: 4, col: 4, digit: 2 },
        ]);
      }),
    ).toBe("23505");
  });

  it("rejects a given for a puzzle with no fillomino subtype row", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(fillominoGivens)
          .values({ puzzleId, row: 0, col: 0, digit: 1 });
      }),
    ).toBe("23503");
  });
});

describe("fillomino module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];
  const upsert = (content: typeof payload) =>
    db.transaction((tx) =>
      fillominoModule.upsertContent(tx, puzzleId, content),
    );

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "fil-test", name: "fil", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "fillomino",
        categoryKey: "fil-test",
        name: "fil",
        description: "fil",
        subtypeTable: "fillomino_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "fillomino",
          slug: "t096-module",
          title: "t096",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await fillominoModule.upsertContent(tx, row.id, payload);
      return row.id;
    });
    userId = await createTestUser("t096mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't096-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload of size and givens only, and the strict schema rejects a solution", async () => {
    const loaded = await load(puzzleId);
    expect(payloadSchema.strict().parse(loaded)).toEqual(loaded);
    expect(Object.keys(loaded).sort()).toEqual(["cols", "givens", "rows"]);
    expect(loaded.rows).toBe(payload.rows);
    expect(loaded.givens).toHaveLength(payload.givens.length);
    expect(
      payloadSchema.strict().safeParse({ ...loaded, solution }).success,
    ).toBe(false);
    expect(
      payloadSchema.strict().safeParse({
        ...loaded,
        givens: [{ row: 0, col: 0, digit: 1, solved: 2 }],
      }).success,
    ).toBe(false);
  });

  it("derives the solution from the puzzle", async () => {
    const [loaded, derived] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(derived).toEqual(solution);
    expect(check(loaded, derived, { cells: derived }).correct).toBe(true);
  });

  it("re-seeding the same content leaves one row per given", async () => {
    await upsert(payload);
    const givens = await db
      .select()
      .from(fillominoGivens)
      .where(eq(fillominoGivens.puzzleId, puzzleId));
    expect(givens).toHaveLength(payload.givens.length);
  });

  it("re-seeding changed content updates in place and removes dropped rows", async () => {
    const [dropped, changed, ...rest] = payload.givens;
    await upsert({
      rows: 6,
      cols: 6,
      givens: [{ ...changed, digit: 2 }, ...rest],
    });
    const rows = await db
      .select({
        row: fillominoGivens.row,
        col: fillominoGivens.col,
        digit: fillominoGivens.digit,
      })
      .from(fillominoGivens)
      .where(eq(fillominoGivens.puzzleId, puzzleId));
    expect(rows).toHaveLength(payload.givens.length - 1);
    expect(rows).not.toContainEqual(dropped);
    expect(rows).toContainEqual({ ...changed, digit: 2 });
    await upsert(payload);
  });

  it("re-seeding content with no givens clears them", async () => {
    await upsert({ rows: 9, cols: 7, givens: [] });
    const [subtype] = await db
      .select({ rows: fillominoPuzzles.rows, cols: fillominoPuzzles.cols })
      .from(fillominoPuzzles)
      .where(eq(fillominoPuzzles.puzzleId, puzzleId));
    const givens = await db
      .select()
      .from(fillominoGivens)
      .where(eq(fillominoGivens.puzzleId, puzzleId));
    expect(subtype).toEqual({ rows: 9, cols: 7 });
    expect(givens).toHaveLength(0);
    await upsert(payload);
  });

  it("replaces, reads back and clears the entered symbols", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await fillominoModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      fillominoModule.replaceAttemptState(tx, attempt.id, {
        cells: [{ row: 0, col: 0, digit: 1 }],
      }),
    );
    await db.transaction((tx) =>
      fillominoModule.replaceAttemptState(tx, attempt.id, {
        cells: [
          { row: 0, col: 0, digit: 1 },
          { row: 0, col: 1, digit: 3 },
        ],
      }),
    );
    const state = await fillominoModule.loadAttemptState(attempt.id);
    expect(state?.cells).toHaveLength(2);

    await fillominoModule.clearAttemptState(attempt.id);
    expect(await fillominoModule.loadAttemptState(attempt.id)).toBeNull();
  });

  describe("attempt tables", () => {
    async function startAttempt(tx: Tx) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(fillominoAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    it.each([
      ["row 12", { row: 12 }],
      ["col -1", { col: -1 }],
      ["digit 0", { digit: 0 }],
    ])("rejects an attempt cell with %s", async (_label, override) => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(fillominoAttemptCells)
            .values({ attemptId, row: 0, col: 0, digit: 1, ...override });
        }),
      ).toBe("23514");
    });

    it("rejects a duplicate cell", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(fillominoAttemptCells).values([
            { attemptId, row: 0, col: 0, digit: 1 },
            { attemptId, row: 0, col: 0, digit: 2 },
          ]);
        }),
      ).toBe("23505");
    });

    it("rejects an attempt subtype row for a puzzle of another attempt type, and cascades on delete", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const otherId = await insertPuzzle(tx, "other", "t096-other");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: otherId })
            .returning({ id: attempts.id });
          await tx.insert(fillominoAttempts).values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(fillominoAttemptCells)
            .values({ attemptId, row: 0, col: 0, digit: 1 });
          await tx.delete(attempts).where(eq(attempts.id, attemptId));
          const left = await tx
            .select()
            .from(fillominoAttemptCells)
            .where(eq(fillominoAttemptCells.attemptId, attemptId));
          if (left.length) throw new Error("cells were not cascaded");
        }),
      ).toBeUndefined();
    });
  });
});
