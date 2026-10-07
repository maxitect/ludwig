import { type Rule, samePlacement, validate } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** `brokenRule` depends only on the payload and the answer, so it never hints at the solution. */
export function check(
  payload: Payload,
  solution: Solution,
  answer: Answer,
): { correct: boolean; brokenRule?: Rule } {
  const verdict = validate(payload, answer.cogs);
  if (!verdict.ok) return { correct: false, brokenRule: verdict.rule };
  return { correct: samePlacement(answer.cogs, solution.cogs) };
}
