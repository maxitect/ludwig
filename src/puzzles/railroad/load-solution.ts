import "server-only";
import { solve } from "./engine";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the track is solved from the clues, which have exactly one. */
export async function loadSolution(puzzleId: string) {
  const track = solve(await load(puzzleId));
  if (!track) throw new Error(`Railroad puzzle has no solution: ${puzzleId}`);
  return solutionSchema.parse(track);
}
