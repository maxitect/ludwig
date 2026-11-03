import "server-only";
import { solve } from "./engine";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the solution is solved from the clues, which have exactly one. */
export async function loadSolution(puzzleId: string) {
  const solution = solve(await load(puzzleId));
  if (!solution) {
    throw new Error(`Reflections puzzle has no solution: ${puzzleId}`);
  }
  return solutionSchema.parse(solution);
}
