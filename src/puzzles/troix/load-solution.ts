import "server-only";
import { db } from "@/db";
import { solve } from "./engine";
import { solutionSchema } from "./schema";

/** Nothing is stored: the solution is solved from the puzzle, which has exactly one completion. */
export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.troixPuzzles.findFirst({
    where: { puzzleId },
    columns: { size: true },
    with: {
      givens: { columns: { row: true, col: true, symbol: true } },
    },
  });
  if (!puzzle) throw new Error(`Troix puzzle not found: ${puzzleId}`);
  const solution = solve(puzzle);
  if (!solution) throw new Error(`Troix puzzle has no solution: ${puzzleId}`);
  return solutionSchema.parse(solution);
}
