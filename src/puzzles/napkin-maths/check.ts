import { normaliseDecimal } from "./decimal";
import type { Answer, Payload } from "./schema";

/** Compares the two decimals as normalised text; the answer is already a validated decimal. */
export function check(
  _payload: Payload,
  solution: string,
  { answer }: Answer,
): { correct: boolean } {
  return { correct: normaliseDecimal(answer) === normaliseDecimal(solution) };
}
