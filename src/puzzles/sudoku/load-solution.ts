import "server-only";
import { db } from "@/db";
import { solve, unitsFor } from "./engine";
import { solutionSchema } from "./schema";

/** Nothing is stored: the solution is solved from the givens, which have exactly one completion. */
export async function loadSolution(puzzleId: string) {
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
  const solution = solve(puzzle.givens, unitsFor(puzzle.regionSet));
  if (!solution) throw new Error(`Sudoku puzzle has no solution: ${puzzleId}`);
  return solutionSchema.parse(solution);
}
