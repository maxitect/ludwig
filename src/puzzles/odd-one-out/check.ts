import type { Answer, Payload, Solution } from "./schema";

/** The explanation comes back as `epilogue` only for the right item, so a wrong guess learns nothing. */
export function check(
  _payload: Payload,
  { itemPosition, explanation }: Solution,
  answer: Answer,
): { correct: boolean; epilogue?: string } {
  return answer.itemPosition === itemPosition
    ? { correct: true, epilogue: explanation }
    : { correct: false };
}
