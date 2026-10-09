import "server-only";
import { deriveBlindSpots } from "./derive";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the blind spots are derived from the layout. */
export async function loadSolution(puzzleId: string) {
  return solutionSchema.parse(deriveBlindSpots(await load(puzzleId)));
}
