import { lettersOf } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

export function check(_payload: Payload, solution: Solution, answer: Answer) {
  return { correct: lettersOf(answer.answer) === solution };
}
