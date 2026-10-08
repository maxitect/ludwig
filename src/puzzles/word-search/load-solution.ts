import "server-only";
import { derivePlacements } from "./derive";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the placements are found in the grid, and `puzzles:verify` proved there is one each. */
export async function loadSolution(puzzleId: string) {
  const payload = await load(puzzleId);
  return solutionSchema.parse(
    derivePlacements(payload, payload.words).flatMap(({ word, placements }) =>
      placements.map((placement) => ({ word, ...placement })),
    ),
  );
}
