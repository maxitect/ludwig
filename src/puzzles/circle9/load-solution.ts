import "server-only";
import { layoutOf, solve } from "./engine";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the solution is solved from the numbers, which have exactly one. */
export async function loadSolution(puzzleId: string) {
  const circled = solve(layoutOf(await load(puzzleId)));
  if (!circled) throw new Error(`Circle9 puzzle has no solution: ${puzzleId}`);
  return solutionSchema.parse(
    circled.map((index) => ({ row: Math.floor(index / 9), col: index % 9 })),
  );
}
