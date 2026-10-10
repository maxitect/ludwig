import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  forceDeferred,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import { puzzles, sudokuRegionCells, sudokuRegionSets } from "@/db/schema";
import { content as tornEdges } from "../../../content/sudoku/torn-edges";
import { content as testCard } from "../../../content/sudoku/test-card";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { sudokuModule } from "./module";
import { payloadSchema } from "./schema";
import { sudokuPuzzles } from "./tables";

const cells = tornEdges.regions.cells;
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
  const slug = `t084-${slugCount++}`;
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey: "sudoku", slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  await tx.insert(sudokuPuzzles).values({ puzzleId: row.id });
  return row.id;
}

async function insertSet(tx: Tx, kept: typeof cells) {
  const puzzleId = await insertSudoku(tx);
  await tx.insert(sudokuRegionSets).values({ puzzleId, kind: "jigsaw" });
  await tx
    .insert(sudokuRegionCells)
    .values(kept.map((cell) => ({ ...cell, puzzleId })));
  await forceDeferred(tx);
  return puzzleId;
}

describe("sudoku_region_sets integrity", () => {
  it("commits a full set of 81 cells with nine in each region", async () => {
    expect(await pgErrorCode((tx) => insertSet(tx, cells).then(() => {}))).toBe(
      undefined,
    );
  });

  it("rejects a set with fewer than 81 cells at commit", async () => {
    const error = await pgError((tx) =>
      insertSet(tx, cells.slice(0, 80)).then(() => {}),
    );
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/needs 81 region cells/);
  });

  it("rejects a set with 81 cells where a region does not have nine", async () => {
    const skewed = cells.map((cell, index) =>
      index === 0 ? { ...cell, region: (cell.region + 1) % 9 } : cell,
    );
    const error = await pgError((tx) => insertSet(tx, skewed).then(() => {}));
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/nine in each of nine regions/);
  });

  it("rejects a region outside 0 to 8 and a kind that does not exist", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.insert(sudokuRegionSets).values({ puzzleId, kind: "jigsaw" });
        await tx
          .insert(sudokuRegionCells)
          .values({ puzzleId, row: 0, col: 0, region: 9 });
      }),
    ).toBe("23514");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertSudoku(tx);
        await tx.execute(
          sql`insert into sudoku_region_sets (puzzle_id, kind) values (${puzzleId}, 'killer')`,
        );
      }),
    ).toBe("22P02");
  });

  it("rejects deleting a cell from a committed set at commit", async () => {
    const error = await pgError(async (tx) => {
      const puzzleId = await insertSet(tx, cells);
      await tx
        .delete(sudokuRegionCells)
        .where(
          sql`${sudokuRegionCells.puzzleId} = ${puzzleId} and ${sudokuRegionCells.row} = 0 and ${sudokuRegionCells.col} = 0`,
        );
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
  });
});

describe("sudoku region variants through the module", () => {
  let puzzleId: string;

  beforeAll(async () => {
    await db.transaction(async (tx) => {
      await ensureTypes(tx);
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "sudoku",
          slug: "t084-module",
          title: "t084",
          difficulty: 1,
        })
        .returning({ id: puzzles.id });
      puzzleId = row.id;
      await sudokuModule.upsertContent(tx, puzzleId, tornEdges);
    });
  });

  afterAll(async () => {
    await db.delete(puzzles).where(sql`${puzzles.slug} like 't084-%'`);
  });

  it("loads the regions into the payload and solves with them", async () => {
    const [payload, solution] = await Promise.all([
      load(puzzleId),
      loadSolution(puzzleId),
    ]);
    expect(payload.regions).toMatchObject({ kind: "jigsaw" });
    expect(payload.regions?.cells).toHaveLength(81);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(check(payload, solution, { cells: solution }).correct).toBe(true);
  });

  it("updates regions in place on re-seed and drops them for a classic puzzle", async () => {
    await db.transaction((tx) =>
      sudokuModule.upsertContent(tx, puzzleId, {
        givens: tornEdges.givens,
        regions: { kind: "rainbow", cells },
      }),
    );
    const sets = await db
      .select()
      .from(sudokuRegionSets)
      .where(eq(sudokuRegionSets.puzzleId, puzzleId));
    expect(sets).toEqual([{ puzzleId, kind: "rainbow" }]);

    await db.transaction((tx) =>
      sudokuModule.upsertContent(tx, puzzleId, {
        givens: testCard.givens,
        regions: testCard.regions,
      }),
    );
    const [moved] = await db
      .select({ region: sudokuRegionCells.region })
      .from(sudokuRegionCells)
      .where(
        sql`${sudokuRegionCells.puzzleId} = ${puzzleId} and ${sudokuRegionCells.row} = 1 and ${sudokuRegionCells.col} = 1`,
      );
    expect(moved.region).toBe(testCard.regions.cells[10].region);

    await db.transaction((tx) =>
      sudokuModule.upsertContent(tx, puzzleId, { givens: testCard.givens }),
    );
    expect(await db.select().from(sudokuRegionSets)).not.toContainEqual(
      expect.objectContaining({ puzzleId }),
    );
    expect(Object.keys(await load(puzzleId))).toEqual(["givens"]);
  });
});
