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
    },
  });
  if (!puzzle) throw new Error(`Sudoku puzzle not found: ${puzzleId}`);
  const { givens, regionSet } = puzzle;
  return payloadSchema.parse({
    givens,
    ...(regionSet && { regions: regionSet }),
  });
}
