import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.sudokuPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      givens: { columns: { row: true, col: true, digit: true } },
      regionSet: {
        columns: { kind: true },
        with: { cells: { columns: { row: true, col: true, region: true } } },
      },
      cages: {
        columns: { sum: true },
        orderBy: { cage: "asc" },
        with: { cells: { columns: { row: true, col: true } } },
      },
      xvSet: {
        columns: {},
        with: {
          marks: { columns: { row: true, col: true, direction: true, mark: true } },
        },
      },
    },
  });
  if (!puzzle) throw new Error(`Sudoku puzzle not found: ${puzzleId}`);
  const { givens, regionSet, cages, xvSet } = puzzle;
  return payloadSchema.parse({
    givens,
    ...(regionSet && { regions: regionSet }),
    ...(cages.length && { cages }),
    ...(xvSet && { xv: xvSet }),
  });
}
