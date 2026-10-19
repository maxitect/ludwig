import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  forceDeferred,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import { puzzles } from "@/db/schema";
import { content as cageMatch } from "../../../content/sudoku/cage-match";
import { content as romanNumerals } from "../../../content/sudoku/roman-numerals";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { sudokuModule } from "./module";
import { payloadSchema } from "./schema";
import {
  sudokuCageCells,
  sudokuCages,
  sudokuPuzzles,
  sudokuXvMarks,
  sudokuXvSets,
} from "./tables";

let slugCount = 0;

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('sdk-test', 'sdk', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('sudoku', 'sdk-test', 'sdk', 'sdk', 'sudoku_puzzles', 1)
    on conflict (key) do nothing
  `);
}

async function insertSudoku(tx: Tx) {
  await ensureTypes(tx);
  const slug = `t093-${slugCount++}`;
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey: "sudoku", slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  await tx.insert(sudokuPuzzles).values({ puzzleId: row.id });
  return row.id;
}

describe("sudoku_cages integrity", () => {
  it("commits a cage with its cells", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuCages).values({ puzzleId, cage: 0, sum: 10 });
        await tx
          .insert(sudokuCageCells)
          .values({ puzzleId, row: 0, col: 0, cage: 0 });
        await forceDeferred(tx);
      }),
    ).toBe(undefined);
  });

  it("rejects a cage with no cells at commit", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await insertSudoku(tx);
      await tx.insert(sudokuCages).values({ puzzleId, cage: 0, sum: 10 });
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/needs at least one cell/);
  });

  it("rejects emptying a committed cage at commit", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await insertSudoku(tx);
      await tx.insert(sudokuCages).values({ puzzleId, cage: 0, sum: 10 });
      await tx
        .insert(sudokuCageCells)
        .values({ puzzleId, row: 0, col: 0, cage: 0 });
      await forceDeferred(tx);
      await tx
        .delete(sudokuCageCells)
        .where(eq(sudokuCageCells.puzzleId, puzzleId));
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
  });

  it("allows deleting a whole cage, and moving a cell as long as both cages keep one", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuCages).values([
          { puzzleId, cage: 0, sum: 10 },
          { puzzleId, cage: 1, sum: 8 },
        ]);
        await tx.insert(sudokuCageCells).values([
          { puzzleId, row: 0, col: 0, cage: 0 },
          { puzzleId, row: 0, col: 1, cage: 0 },
          { puzzleId, row: 1, col: 0, cage: 1 },
        ]);
        await forceDeferred(tx);
        await tx
          .update(sudokuCageCells)
          .set({ cage: 1 })
          .where(
            sql`${sudokuCageCells.puzzleId} = ${puzzleId} and ${sudokuCageCells.row} = 0 and ${sudokuCageCells.col} = 1`,
          );
        await tx
          .delete(sudokuCages)
          .where(
            sql`${sudokuCages.puzzleId} = ${puzzleId} and ${sudokuCages.cage} = 1`,
          );
        await tx
          .insert(sudokuCageCells)
          .values({ puzzleId, row: 5, col: 5, cage: 0 });
        await forceDeferred(tx);
      }),
    ).toBe(undefined);
  });

  it("rejects a sum outside 1 to 45", async () => {
    for (const sum of [0, 46]) {
      expect(
        await pgErrorCode(async (tx) => {
          const puzzleId = await insertSudoku(tx);
          await tx.insert(sudokuCages).values({ puzzleId, cage: 0, sum });
        }),
      ).toBe("23514");
    }
  });

  it("rejects a cell outside the grid, a second cage on one cell and a cage that does not exist", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuCages).values({ puzzleId, cage: 0, sum: 10 });
        await tx
          .insert(sudokuCageCells)
          .values({ puzzleId, row: 9, col: 0, cage: 0 });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuCages).values([
          { puzzleId, cage: 0, sum: 10 },
          { puzzleId, cage: 1, sum: 10 },
        ]);
        await tx.insert(sudokuCageCells).values([
          { puzzleId, row: 0, col: 0, cage: 0 },
          { puzzleId, row: 0, col: 0, cage: 1 },
        ]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx
          .insert(sudokuCageCells)
          .values({ puzzleId, row: 0, col: 0, cage: 3 });
      }),
    ).toBe("23503");
  });
});

describe("sudoku_xv_marks integrity", () => {
  it("rejects a mark with no XV set on the FK", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuXvMarks).values({
          puzzleId,
          row: 0,
          col: 0,
          direction: "right",
          mark: "x",
        });
      }),
    ).toBe("23503");
  });

  it("accepts marks of an XV set, with or without any marks", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuXvSets).values({ puzzleId });
        await tx.insert(sudokuXvMarks).values([
          { puzzleId, row: 0, col: 0, direction: "right", mark: "x" },
          { puzzleId, row: 0, col: 0, direction: "down", mark: "v" },
        ]);
        await forceDeferred(tx);
      }),
    ).toBe(undefined);
  });

  it("rejects an unknown mark, a duplicate edge and a mark that leaves the grid", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuXvSets).values({ puzzleId });
        await tx.execute(
          sql`insert into sudoku_xv_marks (puzzle_id, row, col, direction, mark) values (${puzzleId}, 0, 0, 'right', 'z')`,
        );
      }),
    ).toBe("22P02");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuXvSets).values({ puzzleId });
        await tx.insert(sudokuXvMarks).values([
          { puzzleId, row: 0, col: 0, direction: "right", mark: "x" },
          { puzzleId, row: 0, col: 0, direction: "right", mark: "v" },
        ]);
      }),
    ).toBe("23505");
    for (const [row, col, direction] of [
      [0, 8, "right"],
      [8, 0, "down"],
    ] as const) {
      expect(
        await pgErrorCode(async (tx) => {
          const puzzleId = await insertSudoku(tx);
          await tx.insert(sudokuXvSets).values({ puzzleId });
          await tx
            .insert(sudokuXvMarks)
            .values({ puzzleId, row, col, direction, mark: "x" });
        }),
      ).toBe("23514");
    }
  });
});

describe("killer and XV through the module", () => {
  let killerId: string;
  let xvId: string;

  async function seed(slug: string, content: Parameters<typeof sudokuModule.upsertContent>[2]) {
    return db.transaction(async (tx) => {
      await ensureTypes(tx);
      const [row] = await tx
        .insert(puzzles)
        .values({ typeKey: "sudoku", slug, title: slug, difficulty: 1 })
        .returning({ id: puzzles.id });
      await sudokuModule.upsertContent(tx, row.id, content);
      return row.id;
    });
  }

  beforeAll(async () => {
    killerId = await seed("t093-killer", cageMatch);
    xvId = await seed("t093-xv", romanNumerals);
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't093-%'`);
  });

  it("loads cages and marks into a payload without a solution", async () => {
    const payload = await load(killerId);
    expect(payload.cages).toHaveLength(cageMatch.cages.length);
    expect(payload.cages?.[0]).toEqual({
      sum: cageMatch.cages[0].sum,
      cells: expect.arrayContaining(cageMatch.cages[0].cells),
    });
    expect(payload.xv).toBeUndefined();
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);

    const xv = await load(xvId);
    expect(xv.cages).toBeUndefined();
    expect(xv.xv?.marks).toHaveLength(romanNumerals.xv.marks.length);
    expect(payloadSchema.strict().parse(xv)).toEqual(xv);
  });

  it("solves with the cages and the marks, and accepts the solution", async () => {
    for (const id of [killerId, xvId]) {
      const [payload, solution] = await Promise.all([load(id), loadSolution(id)]);
      expect(check(payload, solution, { cells: solution }).correct).toBe(true);
    }
  });

  it("re-seeds in place, drops what the content drops, and stores no givens for a puzzle without any", async () => {
    await db.transaction((tx) =>
      sudokuModule.upsertContent(tx, killerId, {
        givens: [],
        cages: cageMatch.cages.slice(0, 3),
        xv: { marks: [] },
      }),
    );
    const reloaded = await load(killerId);
    expect(reloaded.givens).toEqual([]);
    expect(reloaded.cages).toHaveLength(3);
    expect(reloaded.xv).toEqual({ marks: [] });

    await db.transaction((tx) =>
      sudokuModule.upsertContent(tx, killerId, { givens: cageMatch.givens }),
    );
    const classic = await load(killerId);
    expect(Object.keys(classic)).toEqual(["givens"]);
    expect(
      await db
        .select()
        .from(sudokuCages)
        .where(eq(sudokuCages.puzzleId, killerId)),
    ).toEqual([]);
  });
});
