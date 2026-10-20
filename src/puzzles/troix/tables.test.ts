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
  troixAttemptCells,
  troixAttempts,
  troixGivens,
  troixPuzzles,
} from "@/db/schema";
import { check } from "./check";
import { payload, solution } from "./fixture";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { troixModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('trx-test', 'trx', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('troix', 'trx-test', 'trx', 'trx', 'troix_puzzles', 1),
           ('other', 'trx-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertTroix(tx: Tx, size = 6) {
  const puzzleId = await insertPuzzle(tx, "troix");
  await tx.insert(troixPuzzles).values({ puzzleId, size });
  return puzzleId;
}

describe("troix_puzzles integrity", () => {
  it("stores no solution column and no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name, data_type from information_schema.columns
      where table_name like 'troix%'
        and (column_name like '%solution%' or data_type in ('jsonb', 'json', 'ARRAY'))
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("declares troix_symbol with x, o and i", async () => {
    const rows = await db.execute<{ enumlabel: string }>(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'troix_symbol' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual(["x", "o", "i"]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(troixPuzzles).values({ puzzleId, size: 6 });
      }),
    ).toBe("23503");
  });

  it("rejects a troix puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "troix");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in troix_puzzles/);
  });

  it.each([6, 9])("accepts a size of %i with a given", async (size) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertTroix(tx, size);
        await tx
          .insert(troixGivens)
          .values({ puzzleId, row: 0, col: 0, symbol: "x" });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([3, 5, 7, 8, 12])("rejects a size of %i", async (size) => {
    expect(
      await pgErrorCode(async (tx) => {
        await insertTroix(tx, size);
      }),
    ).toBe("23514");
  });

  it.each([
    ["row 9", { row: 9 }],
    ["row -1", { row: -1 }],
    ["col 9", { col: 9 }],
    ["col -1", { col: -1 }],
  ])("rejects a given with %s", async (_label, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertTroix(tx, 9);
        await tx
          .insert(troixGivens)
          .values({ puzzleId, row: 0, col: 0, symbol: "x", ...override });
      }),
    ).toBe("23514");
  });

  it("rejects a symbol outside x, o and i", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await insertTroix(tx);
      await tx.execute(sql`
        insert into troix_givens (puzzle_id, row, col, symbol)
        values (${puzzleId}, 0, 0, 'z')
      `);
    });
    expect(error?.code).toBe("22P02");
  });

  it("rejects two givens on one cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertTroix(tx);
        await tx.insert(troixGivens).values([
          { puzzleId, row: 4, col: 4, symbol: "x" },
          { puzzleId, row: 4, col: 4, symbol: "o" },
        ]);
      }),
    ).toBe("23505");
  });

  it("rejects a given for a puzzle with no troix subtype row", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx
          .insert(troixGivens)
          .values({ puzzleId, row: 0, col: 0, symbol: "x" });
      }),
    ).toBe("23503");
  });
});

describe("troix module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];
  const upsert = (content: typeof payload) =>
    db.transaction((tx) => troixModule.upsertContent(tx, puzzleId, content));

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "trx-test", name: "trx", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "troix",
        categoryKey: "trx-test",
        name: "trx",
        description: "trx",
        subtypeTable: "troix_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "troix",
          slug: "t088-module",
          title: "t088",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await troixModule.upsertContent(tx, row.id, payload);
      return row.id;
    });
    userId = await createTestUser("t088mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't088-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload of size and givens only, and the strict schema rejects a solution", async () => {
    const loaded = await load(puzzleId);
    expect(payloadSchema.strict().parse(loaded)).toEqual(loaded);
    expect(Object.keys(loaded).sort()).toEqual(["givens", "size"]);
    expect(loaded.size).toBe(payload.size);
    expect(loaded.givens).toHaveLength(payload.givens.length);
    expect(
      payloadSchema.strict().safeParse({ ...loaded, solution }).success,
    ).toBe(false);
    expect(
      payloadSchema.strict().safeParse({
        ...loaded,
        givens: [{ row: 0, col: 0, symbol: "x", solved: "o" }],
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
      .from(troixGivens)
      .where(eq(troixGivens.puzzleId, puzzleId));
    expect(givens).toHaveLength(payload.givens.length);
  });

  it("re-seeding changed content updates in place and removes dropped rows", async () => {
    const [dropped, changed, ...rest] = payload.givens;
    await upsert({ size: 6, givens: [{ ...changed, symbol: "o" }, ...rest] });
    const rows = await db
      .select({
        row: troixGivens.row,
        col: troixGivens.col,
        symbol: troixGivens.symbol,
      })
      .from(troixGivens)
      .where(eq(troixGivens.puzzleId, puzzleId));
    expect(rows).toHaveLength(payload.givens.length - 1);
    expect(rows).not.toContainEqual(dropped);
    expect(rows).toContainEqual({ ...changed, symbol: "o" });
    await upsert(payload);
  });

  it("re-seeding content with no givens clears them", async () => {
    await upsert({ size: 9, givens: [] });
    const [subtype] = await db
      .select({ size: troixPuzzles.size })
      .from(troixPuzzles)
      .where(eq(troixPuzzles.puzzleId, puzzleId));
    const givens = await db
      .select()
      .from(troixGivens)
      .where(eq(troixGivens.puzzleId, puzzleId));
    expect(subtype.size).toBe(9);
    expect(givens).toHaveLength(0);
    await upsert(payload);
  });

  it("replaces, reads back and clears the entered symbols", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await troixModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      troixModule.replaceAttemptState(tx, attempt.id, {
        cells: [{ row: 0, col: 0, symbol: "x" }],
      }),
    );
    await db.transaction((tx) =>
      troixModule.replaceAttemptState(tx, attempt.id, {
        cells: [
          { row: 0, col: 0, symbol: "x" },
          { row: 0, col: 1, symbol: "i" },
        ],
      }),
    );
    const state = await troixModule.loadAttemptState(attempt.id);
    expect(state?.cells).toHaveLength(2);

    await troixModule.clearAttemptState(attempt.id);
    expect(await troixModule.loadAttemptState(attempt.id)).toBeNull();
  });

  describe("attempt tables", () => {
    async function startAttempt(tx: Tx) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(troixAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    it.each([
      ["row 9", { row: 9 }],
      ["col -1", { col: -1 }],
    ])("rejects an attempt cell with %s", async (_label, override) => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(troixAttemptCells)
            .values({ attemptId, row: 0, col: 0, symbol: "x", ...override });
        }),
      ).toBe("23514");
    });

    it("rejects a duplicate cell", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(troixAttemptCells).values([
            { attemptId, row: 0, col: 0, symbol: "x" },
            { attemptId, row: 0, col: 0, symbol: "o" },
          ]);
        }),
      ).toBe("23505");
    });

    it("rejects an attempt subtype row for a puzzle of another attempt type, and cascades on delete", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const otherId = await insertPuzzle(tx, "other", "t088-other");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: otherId })
            .returning({ id: attempts.id });
          await tx.insert(troixAttempts).values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(troixAttemptCells)
            .values({ attemptId, row: 0, col: 0, symbol: "x" });
          await tx.delete(attempts).where(eq(attempts.id, attemptId));
          const left = await tx
            .select()
            .from(troixAttemptCells)
            .where(eq(troixAttemptCells.attemptId, attemptId));
          if (left.length) throw new Error("cells were not cascaded");
        }),
      ).toBeUndefined();
    });
  });
});
