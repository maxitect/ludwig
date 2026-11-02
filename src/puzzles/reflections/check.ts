import { unmatchedPorts } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * The puzzle has one solution, so nothing is compared with it. An answer is correct when it puts
 * exactly one mirror in every slot and nowhere else, and every lettered beam leaves by its partner.
 * Wrong parts are the lettered ports whose beam leaves elsewhere, found by tracing the answer.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const slots = new Set(payload.slots.map(({ row, col }) => `${row},${col}`));
  const placed = new Set<string>();
  const mirrors = answer.mirrors.filter(({ row, col }) => {
    const key = `${row},${col}`;
    if (!slots.has(key) || placed.has(key)) return false;
    placed.add(key);
    return true;
  });
  const wrongParts = unmatchedPorts(payload, mirrors);
  return {
    correct:
      wrongParts.length === 0 &&
      placed.size === slots.size &&
      mirrors.length === answer.mirrors.length,
    wrongParts,
  };
}
