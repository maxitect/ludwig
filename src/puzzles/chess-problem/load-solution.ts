import "server-only";
import { toFen } from "./derive";
import { keyMoves } from "./engine";
import { load } from "./load";
import { solutionSchema } from "./schema";

/** Nothing is stored: the position is solved here. */
export async function loadSolution(puzzleId: string) {
  const payload = await load(puzzleId);
  const keys = keyMoves(toFen(payload), payload.mateIn).map(
    ({ from, to, promotion }) => ({ from, to, promotion }),
  );
  return solutionSchema.parse({ keys });
}
