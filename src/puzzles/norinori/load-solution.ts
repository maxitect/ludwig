import "server-only";
import { layoutOf, solve } from "./engine";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the solution is solved from the regions, which have exactly one. */
export async function loadSolution(puzzleId: string) {
  const payload = await load(puzzleId);
  const shaded = solve(layoutOf(payload));
  if (!shaded) throw new Error(`Norinori puzzle has no solution: ${puzzleId}`);
  return solutionSchema.parse(
    shaded.map((index) => ({
      row: Math.floor(index / payload.cols),
      col: index % payload.cols,
    })),
  );
}
