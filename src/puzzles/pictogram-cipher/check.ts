import { lettersOf } from "../_shared/cipher-key/cipher-key";
import { derivePlaintext } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/** Spacing, case and punctuation never count: only the letters are compared. */
export function check(_payload: Payload, solution: Solution, answer: Answer) {
  return {
    correct: lettersOf(answer.answer) === lettersOf(derivePlaintext(solution)),
  };
}
