import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { checkPuzzleAnswer } from "@/lib/data/puzzles";
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
  starBattleAttemptMarks,
  starBattleAttempts,
  starBattlePuzzles,
  starBattleRegionCells,
} from "@/db/schema";
import { content as doubleBill } from "../../../content/star-battle/double-bill";
import { content as firstLight } from "../../../content/star-battle/first-light";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { starBattleModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('sb-test', 'sb', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('star-battle', 'sb-test', 'sb', 'sb', 'star_battle_puzzles', 1),
           ('other', 'sb-test', 'other', 'other', 'zz_other_puzzles', 2)
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

const subtype = (puzzleId: string) => ({ puzzleId, size: 6, stars: 1 });

async function insertAttempt(tx: Tx, userId: string) {
  const puzzleId = await insertPuzzle(tx, "star-battle");
  await tx.insert(starBattlePuzzles).values(subtype(puzzleId));
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  await tx.insert(starBattleAttempts).values({ attemptId: attempt.id });
  return attempt.id;
}

describe("star battle tables", () => {
  it("stores no solution column, no json and no array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'star_battle%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(star_row|star_col|solution)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates the star_mark enum", async () => {
    const rows = await db.execute(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'star_mark' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual(["star", "dot"]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(starBattlePuzzles).values(subtype(puzzleId));
      }),
    ).toBe("23503");
  });

  it("rejects a star battle puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "star-battle");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in star_battle_puzzles/);
  });

  it.each([
    ["stars of 3", { stars: 3 }],
    ["stars of 0", { stars: 0 }],
    ["a size of 11", { size: 11 }],
    ["a size of 4", { size: 4 }],
  ])("rejects %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "star-battle");
        await tx
          .insert(starBattlePuzzles)
          .values({ ...subtype(puzzleId), ...override });
      }),
    ).toBe("23514");
  });

  it.each([
    [5, 1],
    [10, 2],
  ])("accepts a size of %i with %i stars", async (size, stars) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "star-battle");
        await tx
          .insert(starBattlePuzzles)
          .values({ ...subtype(puzzleId), size, stars });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["a row of 10", { row: 10 }],
    ["a column of 10", { col: 10 }],
    ["a region of 10", { region: 10 }],
    ["a negative row", { row: -1 }],
  ])("rejects a region cell with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "star-battle");
        await tx.insert(starBattlePuzzles).values(subtype(puzzleId));
        await tx
          .insert(starBattleRegionCells)
          .values({ puzzleId, row: 0, col: 0, region: 0, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects a duplicate region cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "star-battle");
        await tx.insert(starBattlePuzzles).values(subtype(puzzleId));
        const cell = { puzzleId, row: 0, col: 0, region: 0 };
        await tx.insert(starBattleRegionCells).values([cell, cell]);
      }),
    ).toBe("23505");
  });

  it("does not catch a missing cell or region: puzzles:verify does", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "star-battle");
        await tx.insert(starBattlePuzzles).values(subtype(puzzleId));
        await tx
          .insert(starBattleRegionCells)
          .values({ puzzleId, row: 0, col: 0, region: 0 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t087tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(starBattleAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("rejects a duplicate mark, an unknown mark and a negative cell", async () => {
    const userId = await createTestUser("t087mark");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        const mark = { attemptId, row: 0, col: 1, mark: "star" as const };
        await tx.insert(starBattleAttemptMarks).values([mark, mark]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx.execute(
          sql`insert into star_battle_attempt_marks (attempt_id, row, col, mark) values (${attemptId}, 0, 0, 'moon')`,
        );
      }),
    ).toBe("22P02");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx
          .insert(starBattleAttemptMarks)
          .values({ attemptId, row: -1, col: 0, mark: "dot" });
      }),
    ).toBe("23514");
  });
});

describe("star battle module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "sb-test", name: "sb", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "star-battle",
        categoryKey: "sb-test",
        name: "sb",
        description: "sb",
        subtypeTable: "star_battle_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "star-battle",
          slug: "t087-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await starBattleModule.upsertContent(tx, row.id, doubleBill);
      return row.id;
    });
    userId = await createTestUser("t087mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the size, stars and regions only, with no solution field", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual(["regions", "size", "stars"]);
    expect(payload.regions).toHaveLength(64);
    expect(JSON.stringify(payload)).not.toMatch(/solution|star_row|answer/);
  });

  it("rejects a payload that carries the stars", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, solution: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({
        ...payload,
        regions: payload.regions.map((cell) => ({ ...cell, star: true })),
      }),
    ).toThrow();
  });

  it("solves the stored regions to the one solution", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution).toHaveLength(16);
    const right = await checkPuzzleAnswer("star-battle", puzzleId, {
      stars: solution,
    });
    expect(right.correct).toBe(true);
    const wrong = await checkPuzzleAnswer("star-battle", puzzleId, {
      stars: solution.slice(1),
    });
    expect(wrong.correct).toBe(false);
  });

  it("updates the regions in place", async () => {
    await db.transaction((tx) =>
      starBattleModule.upsertContent(tx, puzzleId, firstLight),
    );
    const small = await load(puzzleId);
    expect(small).toMatchObject({ size: 6, stars: 1 });
    expect(small.regions).toHaveLength(36);
    await db.transaction((tx) =>
      starBattleModule.upsertContent(tx, puzzleId, doubleBill),
    );
    const restored = await load(puzzleId);
    expect(restored).toMatchObject({ size: 8, stars: 2 });
    expect(restored.regions).toHaveLength(64);
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await starBattleModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      starBattleModule.replaceAttemptState(tx, attempt.id, {
        marks: [
          { row: 0, col: 1, mark: "star" },
          { row: 1, col: 3, mark: "dot" },
        ],
      }),
    );
    const saved = await starBattleModule.loadAttemptState(attempt.id);
    expect(saved?.marks).toHaveLength(2);

    await db.transaction((tx) =>
      starBattleModule.replaceAttemptState(tx, attempt.id, {
        marks: [{ row: 2, col: 4, mark: "dot" }],
      }),
    );
    expect(await starBattleModule.loadAttemptState(attempt.id)).toEqual({
      marks: [{ row: 2, col: 4, mark: "dot" }],
    });

    await starBattleModule.clearAttemptState(attempt.id);
    expect(await starBattleModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
