import { findDifferenceAt } from "./regions";
import type { Answer, Payload, Solution } from "./schema";

/** Correct when the taps land in every difference region. */
export function check(_payload: Payload, solution: Solution, { taps }: Answer) {
  const found = new Set(
    taps.flatMap((tap) => findDifferenceAt(solution, tap)?.index ?? []),
  );
  return { correct: found.size === solution.length };
}
