import { conflictingIndexes, layoutOf, loneIndexes } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any shading that puts two cells in every region, with every shaded cell in a domino that touches no other, is correct.
 * The puzzle has one such shading, so nothing is compared with the solution.
 * Wrong cells are the shaded cells that break a rule: a third neighbour, a crowded region or no neighbour at all.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const layout = layoutOf(payload);
  const inside = answer.shaded.every(
    ({ row, col }) => row < layout.rows && col < layout.cols,
  );
  const placed = new Set(
    answer.shaded.map(({ row, col }) => row * layout.cols + col),
  );
  const regions = new Set(layout.regionOf).size;
  const wrong = new Set([
    ...conflictingIndexes(layout, placed),
    ...loneIndexes(layout, placed),
  ]);
  const wrongParts = [...wrong]
    .sort((a, b) => a - b)
    .map((index) => ({
      row: Math.floor(index / layout.cols),
      col: index % layout.cols,
    }));
  return {
    correct: inside && wrongParts.length === 0 && placed.size === regions * 2,
    wrongParts,
  };
}
