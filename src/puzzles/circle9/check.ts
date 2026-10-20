import { SIZE, cellOf, clashingIndexes, layoutOf } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any nine circles on numbers, one of each digit and one in every row, column and box, are correct.
 * The puzzle has one such set, so nothing is compared with the solution.
 * Wrong cells are the circles on an empty cell, and the circles that clash with another.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const layout = layoutOf(payload);
  const placed = new Set(
    answer.circles.map(({ row, col }) => row * SIZE + col),
  );
  const wrong = new Set([
    ...[...placed].filter((index) => !layout.digits[index]),
    ...clashingIndexes(layout, placed),
  ]);
  const wrongParts = [...wrong].sort((a, b) => a - b).map(cellOf);
  return {
    correct: wrongParts.length === 0 && placed.size === SIZE,
    wrongParts,
  };
}
