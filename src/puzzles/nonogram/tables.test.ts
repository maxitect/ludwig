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
  nonogramAttemptMarks,
  nonogramAttempts,
  nonogramCells,
  nonogramPuzzles,
} from "@/db/schema";
import { content as gear } from "../../../content/nonogram/blind-spot";
import { content as inkWell } from "../../../content/nonogram/ink-well";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { nonogramModule } from "./module";
import { payloadSchema } from "./schema";
import { shadedCells } from "./verify";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('ng-test', 'ng', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('nonogram', 'ng-test', 'ng', 'ng', 'nonogram_puzzles', 1),
           ('other', 'ng-test', 'other', 'other', 'zz_other_puzzles', 2)
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

const subtype = (puzzleId: string) => ({
  puzzleId,
  rows: 10,
  cols: 10,
  caption: "a caption",
});

async function insertAttempt(tx: Tx, userId: string) {
  const puzzleId = await insertPuzzle(tx, "nonogram");
  await tx.insert(nonogramPuzzles).values(subtype(puzzleId));
  const [attempt] = await tx
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  await tx.insert(nonogramAttempts).values({ attemptId: attempt.id });
  return attempt.id;
}

describe("nonogram tables", () => {
  it("stores no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'nonogram%'
        and data_type in ('jsonb', 'json', 'ARRAY')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("stores no clue column: the clues are derived from the cells", async () => {
    const rows = await db.execute(sql`
      select column_name from information_schema.columns
      where table_name like 'nonogram%' and column_name ~ 'clue'
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates the nonogram_mark enum", async () => {
    const rows = await db.execute(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'nonogram_mark' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual(["fill", "cross"]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(nonogramPuzzles).values(subtype(puzzleId));
      }),
    ).toBe("23503");
  });

  it("rejects a nonogram puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "nonogram");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in nonogram_puzzles/);
  });

  it.each([
    ["rows of 4", { rows: 4 }],
    ["rows of 26", { rows: 26 }],
    ["cols of 4", { cols: 4 }],
    ["cols of 26", { cols: 26 }],
  ])("rejects %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "nonogram");
        await tx
          .insert(nonogramPuzzles)
          .values({ ...subtype(puzzleId), ...override });
      }),
    ).toBe("23514");
  });

  it.each([
    [5, 5],
    [25, 25],
    [10, 15],
  ])("accepts %i rows by %i columns", async (rows, cols) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "nonogram");
        await tx
          .insert(nonogramPuzzles)
          .values({ ...subtype(puzzleId), rows, cols });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("requires a caption", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "nonogram");
        await tx.execute(
          sql`insert into nonogram_puzzles (puzzle_id, rows, cols) values (${puzzleId}, 10, 10)`,
        );
      }),
    ).toBe("23502");
  });

  it.each([
    ["a row of 25", { row: 25 }],
    ["a column of 25", { col: 25 }],
    ["a negative row", { row: -1 }],
    ["a negative column", { col: -1 }],
  ])("rejects a cell with %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "nonogram");
        await tx.insert(nonogramPuzzles).values(subtype(puzzleId));
        await tx
          .insert(nonogramCells)
          .values({ puzzleId, row: 0, col: 0, ...override });
      }),
    ).toBe("23514");
  });

  it("rejects a duplicate cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "nonogram");
        await tx.insert(nonogramPuzzles).values(subtype(puzzleId));
        const cell = { puzzleId, row: 0, col: 0 };
        await tx.insert(nonogramCells).values([cell, cell]);
      }),
    ).toBe("23505");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t094tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(nonogramAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("rejects a duplicate mark, an unknown mark and a negative cell", async () => {
    const userId = await createTestUser("t094mark");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        const mark = { attemptId, row: 0, col: 1, mark: "fill" as const };
        await tx.insert(nonogramAttemptMarks).values([mark, mark]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx.execute(
          sql`insert into nonogram_attempt_marks (attempt_id, row, col, mark) values (${attemptId}, 0, 0, 'moon')`,
        );
      }),
    ).toBe("22P02");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await insertAttempt(tx, userId);
        await tx
          .insert(nonogramAttemptMarks)
          .values({ attemptId, row: -1, col: 0, mark: "cross" });
      }),
    ).toBe("23514");
  });
});

describe("nonogram module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "ng-test", name: "ng", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "nonogram",
        categoryKey: "ng-test",
        name: "ng",
        description: "ng",
        subtypeTable: "nonogram_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "nonogram",
          slug: "t094-module",
          title: "t",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await nonogramModule.upsertContent(tx, row.id, gear);
      return row.id;
    });
    userId = await createTestUser("t094mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the size and clues only, with no cells and no caption", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual([
      "colClues",
      "cols",
      "rowClues",
      "rows",
    ]);
    expect(payload.rowClues).toHaveLength(13);
    expect(payload.colClues).toHaveLength(13);
    expect(payload.rowClues[0]).toEqual([3]);
    const text = JSON.stringify(payload);
    expect(text).not.toContain(gear.caption);
    expect(text).not.toMatch(/caption|cells|solution|shaded/);
  });

  it("rejects a payload that carries the cells or the caption", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, caption: gear.caption }),
    ).toThrow();
    expect(() =>
      payloadSchema
        .strict()
        .parse({ ...payload, cells: [{ row: 0, col: 0 }] }),
    ).toThrow();
  });

  it("reads the stored picture back as the solution", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution.caption).toBe(gear.caption);
    expect(solution.cells).toHaveLength(shadedCells(gear).length);
  });

  it("accepts the picture, reveals the caption only then, and rejects a miss", async () => {
    const { cells } = await loadSolution(puzzleId);
    const right = await checkPuzzleAnswer("nonogram", puzzleId, {
      shaded: cells,
    });
    expect(right).toMatchObject({ correct: true, epilogue: gear.caption });
    const wrong = await checkPuzzleAnswer("nonogram", puzzleId, {
      shaded: cells.slice(1),
    });
    expect(wrong.correct).toBe(false);
    expect(JSON.stringify(wrong)).not.toContain(gear.caption);
  });

  it("updates the picture in place", async () => {
    await db.transaction((tx) =>
      nonogramModule.upsertContent(tx, puzzleId, inkWell),
    );
    const small = await load(puzzleId);
    expect(small).toMatchObject({ rows: 11, cols: 15 });
    expect((await loadSolution(puzzleId)).caption).toBe(inkWell.caption);
    await db.transaction((tx) =>
      nonogramModule.upsertContent(tx, puzzleId, gear),
    );
    const restored = await load(puzzleId);
    expect(restored).toMatchObject({ rows: 13, cols: 13 });
    expect((await loadSolution(puzzleId)).cells).toHaveLength(
      shadedCells(gear).length,
    );
  });

  it("replaces, reads back and clears the attempt state", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await nonogramModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      nonogramModule.replaceAttemptState(tx, attempt.id, {
        marks: [
          { row: 0, col: 1, mark: "fill" },
          { row: 1, col: 3, mark: "cross" },
        ],
      }),
    );
    const saved = await nonogramModule.loadAttemptState(attempt.id);
    expect(saved?.marks).toHaveLength(2);

    await db.transaction((tx) =>
      nonogramModule.replaceAttemptState(tx, attempt.id, {
        marks: [{ row: 2, col: 4, mark: "cross" }],
      }),
    );
    expect(await nonogramModule.loadAttemptState(attempt.id)).toEqual({
      marks: [{ row: 2, col: 4, mark: "cross" }],
    });

    await nonogramModule.clearAttemptState(attempt.id);
    expect(await nonogramModule.loadAttemptState(attempt.id)).toBeNull();
  });
});
