import "server-only";
import { deriveSeen } from "./derive";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the seen cells are derived from the cameras. */
export async function loadSolution(puzzleId: string) {
  return solutionSchema.parse({ seen: deriveSeen(await load(puzzleId)) });
}
