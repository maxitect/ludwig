import { lettersOf } from "./derive";
import type { Answer, Payload } from "./schema";

export function check(_payload: Payload, solution: string, answer: Answer) {
  return { correct: lettersOf(answer.answer) === lettersOf(solution) };
}
