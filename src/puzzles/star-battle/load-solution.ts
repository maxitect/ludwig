import "server-only";
import { layoutOf, solve } from "./engine";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the solution is solved from the regions, which have exactly one. */
export async function loadSolution(puzzleId: string) {
  const payload = await load(puzzleId);
  const stars = solve(layoutOf(payload));
  if (!stars) throw new Error(`Star battle puzzle has no solution: ${puzzleId}`);
  return solutionSchema.parse(
    stars.map((index) => ({
      row: Math.floor(index / payload.size),
      col: index % payload.size,
    })),
  );
}
