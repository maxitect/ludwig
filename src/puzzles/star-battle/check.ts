import { conflictingIndexes, layoutOf } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any placement that touches no star and fills every row, column and region with exactly `stars` is correct.
 * The puzzle has one such placement, so nothing is compared with the solution. Wrong cells are the stars that break a rule.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const layout = layoutOf(payload);
  const inside = answer.stars.every(
    ({ row, col }) => row < layout.size && col < layout.size,
  );
  const placed = new Set(
    answer.stars.map(({ row, col }) => row * layout.size + col),
  );
  const wrong = conflictingIndexes(layout, placed);
  const wrongParts = [...wrong]
    .sort((a, b) => a - b)
    .map((index) => ({
      row: Math.floor(index / layout.size),
      col: index % layout.size,
    }));
  return {
    correct:
      inside &&
      wrongParts.length === 0 &&
      placed.size === layout.size * layout.stars,
    wrongParts,
  };
}
