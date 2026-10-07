import { samePlacement, solve, validate } from "./engine";
import type { Content } from "./schema";

/** Throws unless the stored placement is valid and is the only valid placement. */
export function verifyGearTrain({ solution, ...board }: Content) {
  const verdict = validate(board, solution);
  if (!verdict.ok) {
    throw new Error(`the stored placement breaks rule ${verdict.rule}`);
  }
  const found = solve(board);
  if (found.length !== 1) {
    throw new Error(`expected exactly 1 placement, found ${found.length}`);
  }
  if (!samePlacement(found[0], solution)) {
    throw new Error("the stored placement is not the unique solution");
  }
}
