import { samePlacement } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/** Correct when every hidden word has a selection on one of its placements, either way round. */
export function check(payload: Payload, solution: Solution, answer: Answer) {
  return {
    correct: payload.words.every((word) =>
      solution.some(
        (placement) =>
          placement.word === word &&
          answer.selections.some((selection) =>
            samePlacement(placement, selection),
          ),
      ),
    ),
  };
}
