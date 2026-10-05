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
  sudokuAttemptCells,
  sudokuAttemptNotes,
  sudokuAttempts,
  sudokuGivens,
  sudokuPuzzles,
} from "@/db/schema";
import { check, checkCell } from "./check";
import { givens, solution } from "./fixture";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { sudokuModule } from "./module";
import { payloadSchema } from "./schema";

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('sdk-test', 'sdk', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('sudoku', 'sdk-test', 'sdk', 'sdk', 'sudoku_puzzles', 1),
           ('other', 'sdk-test', 'other', 'other', 'zz_other_puzzles', 2)
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

async function insertSudoku(tx: Tx) {
  const puzzleId = await insertPuzzle(tx, "sudoku");
  await tx.insert(sudokuPuzzles).values({ puzzleId });
  return puzzleId;
}

describe("sudoku_puzzles integrity", () => {
  it("stores no solution column and no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name, data_type from information_schema.columns
      where table_name like 'sudoku%'
        and (column_name like '%solution%' or data_type in ('jsonb', 'json', 'ARRAY'))
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(sudokuPuzzles).values({ puzzleId });
      }),
    ).toBe("23503");
  });

  it("rejects a sudoku puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "sudoku");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in sudoku_puzzles/);
  });

  it("accepts a valid supertype, subtype and given", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx
          .insert(sudokuGivens)
          .values({ puzzleId, row: 0, col: 0, digit: 5 });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([
    ["digit 0", { digit: 0 }],
    ["digit 10", { digit: 10 }],
    ["row 9", { row: 9 }],
    ["row -1", { row: -1 }],
    ["col 9", { col: 9 }],
    ["col -1", { col: -1 }],
  ])("rejects a given with %s", async (_label, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx
          .insert(sudokuGivens)
          .values({ puzzleId, row: 0, col: 0, digit: 5, ...override });
      }),
    ).toBe("23514");
  });

  it("accepts the bounds and rejects two givens on one cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuGivens).values([
          { puzzleId, row: 0, col: 0, digit: 1 },
          { puzzleId, row: 8, col: 8, digit: 9 },
        ]);
      }),
    ).toBeUndefined();
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuGivens).values([
          { puzzleId, row: 4, col: 4, digit: 1 },
          { puzzleId, row: 4, col: 4, digit: 2 },
        ]);
      }),
    ).toBe("23505");
  });
});

describe("sudoku module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "sdk-test", name: "sdk", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "sudoku",
        categoryKey: "sdk-test",
        name: "sdk",
        description: "sdk",
        subtypeTable: "sudoku_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "sudoku",
          slug: "t046-module",
          title: "t046",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      await sudokuModule.upsertContent(tx, row.id, { givens });
      return row.id;
    });
    userId = await createTestUser("t046mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't046-%'`);
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads a payload of givens only, and the strict schema rejects a solution", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload)).toEqual(["givens"]);
    expect(payload.givens).toHaveLength(givens.length);
    expect(
      payloadSchema.strict().safeParse({ ...payload, solution }).success,
    ).toBe(false);
    expect(
      payloadSchema
        .strict()
        .safeParse({ givens: [{ row: 0, col: 2, digit: 4, solved: 4 }] })
        .success,
    ).toBe(false);
  });

  it("derives the solution from the givens", async () => {
    const [payload, derived] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(derived).toEqual(solution);
    expect(check(payload, derived, { cells: derived }).correct).toBe(true);
    expect(checkCell(payload, derived, 0, 2, "4").correct).toBe(true);
  });

  it("re-seeding the same content leaves one row per given", async () => {
    await db.transaction((tx) =>
      sudokuModule.upsertContent(tx, puzzleId, { givens }),
    );
    const rows = await db
      .select()
      .from(sudokuGivens)
      .where(eq(sudokuGivens.puzzleId, puzzleId));
    expect(rows).toHaveLength(givens.length);
  });

  it("replaces, reads back and clears digits and notes", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await sudokuModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      sudokuModule.replaceAttemptState(tx, attempt.id, {
        cells: [{ row: 0, col: 2, digit: 4 }],
        notes: [
          { row: 0, col: 3, digit: 6 },
          { row: 0, col: 3, digit: 2 },
        ],
      }),
    );
    await db.transaction((tx) =>
      sudokuModule.replaceAttemptState(tx, attempt.id, {
        cells: [
          { row: 0, col: 2, digit: 4 },
          { row: 0, col: 3, digit: 6 },
        ],
        notes: [{ row: 1, col: 1, digit: 7 }],
      }),
    );
    const state = await sudokuModule.loadAttemptState(attempt.id);
    expect(state?.cells).toHaveLength(2);
    expect(state?.notes).toEqual([{ row: 1, col: 1, digit: 7 }]);

    await sudokuModule.clearAttemptState(attempt.id);
    expect(await sudokuModule.loadAttemptState(attempt.id)).toBeNull();
  });

  describe("attempt tables", () => {
    async function startAttempt(tx: Tx) {
      await tx.delete(attempts).where(eq(attempts.userId, userId));
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(sudokuAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    }

    it.each([
      ["digit 0", { digit: 0 }],
      ["digit 10", { digit: 10 }],
      ["row 9", { row: 9 }],
      ["col -1", { col: -1 }],
    ])("rejects an attempt cell and a note with %s", async (_label, override) => {
      const base = { row: 0, col: 0, digit: 5 };
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(sudokuAttemptCells)
            .values({ attemptId, ...base, ...override });
        }),
      ).toBe("23514");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(sudokuAttemptNotes)
            .values({ attemptId, ...base, ...override });
        }),
      ).toBe("23514");
    });

    it("rejects a duplicate cell and a duplicate note, and allows several notes per cell", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(sudokuAttemptCells).values([
            { attemptId, row: 0, col: 0, digit: 1 },
            { attemptId, row: 0, col: 0, digit: 2 },
          ]);
        }),
      ).toBe("23505");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(sudokuAttemptNotes).values([
            { attemptId, row: 0, col: 0, digit: 1 },
            { attemptId, row: 0, col: 0, digit: 1 },
          ]);
        }),
      ).toBe("23505");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx.insert(sudokuAttemptNotes).values([
            { attemptId, row: 0, col: 0, digit: 1 },
            { attemptId, row: 0, col: 0, digit: 2 },
          ]);
        }),
      ).toBeUndefined();
    });

    it("rejects an attempt subtype row for a puzzle of another attempt type, and cascades on delete", async () => {
      expect(
        await pgErrorCode(async (tx) => {
          const otherId = await insertPuzzle(tx, "other", "t046-other");
          const [attempt] = await tx
            .insert(attempts)
            .values({ userId, puzzleId: otherId })
            .returning({ id: attempts.id });
          await tx.insert(sudokuAttempts).values({ attemptId: attempt.id });
        }),
      ).toBe("23503");
      expect(
        await pgErrorCode(async (tx) => {
          const attemptId = await startAttempt(tx);
          await tx
            .insert(sudokuAttemptCells)
            .values({ attemptId, row: 0, col: 0, digit: 1 });
          await tx.delete(attempts).where(eq(attempts.id, attemptId));
          const left = await tx
            .select()
            .from(sudokuAttemptCells)
            .where(eq(sudokuAttemptCells.attemptId, attemptId));
          if (left.length) throw new Error("cells were not cascaded");
        }),
      ).toBeUndefined();
    });
  });
});
