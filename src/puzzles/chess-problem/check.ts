import { plyToMove, toFen } from "./derive";
import { checkLine } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** A wrong line names its first move when that is no key, and otherwise its last White move. */
export function check(payload: Payload, solution: Solution, answer: Answer) {
  const plies = answer.plies.map(plyToMove);
  if (checkLine(toFen(payload), payload.mateIn, plies, solution.keys)) {
    return { correct: true };
  }
  const first = plies[0];
  const isKey = solution.keys.some(
    (key) =>
      key.from === first.from &&
      key.to === first.to &&
      key.promotion === first.promotion,
  );
  const lastWhite = plies.length % 2 === 1 ? plies.length : plies.length - 1;
  return { correct: false, wrongParts: [{ ply: isKey ? lastWhite : 1 }] };
}
