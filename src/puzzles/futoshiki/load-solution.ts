import "server-only";
import { db } from "@/db";
import { solve } from "./engine";
import { solutionSchema } from "./schema";

/** Nothing is stored: the solution is solved from the puzzle, which has exactly one completion. */
export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.futoshikiPuzzles.findFirst({
    where: { puzzleId },
    columns: { size: true },
    with: {
      givens: { columns: { row: true, col: true, digit: true } },
      inequalities: {
        columns: { row: true, col: true, direction: true, relation: true },
      },
    },
  });
  if (!puzzle) throw new Error(`Futoshiki puzzle not found: ${puzzleId}`);
  const solution = solve(puzzle);
  if (!solution) {
    throw new Error(`Futoshiki puzzle has no solution: ${puzzleId}`);
  }
  return solutionSchema.parse(solution);
}
