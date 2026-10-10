import {
  conflictingIndexes,
  gridFromGivens,
  unitsFor,
  type Grid,
} from "./engine";
import type { Answer, Payload, Solution } from "./schema";

const SIZE = 9;

/**
 * Any completion that respects the givens and repeats no digit in a unit (row, column, and box or region) is correct.
 * Wrong cells are the ones that break a rule or overwrite a given, never a comparison with the solution.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const givens = gridFromGivens(payload.givens);
  const grid: Grid = Array(SIZE * SIZE).fill(0);
  for (const { row, col, digit } of answer.cells)
    grid[row * SIZE + col] = digit;
  const wrong = conflictingIndexes(grid, unitsFor(payload.regions));
  grid.forEach((digit, index) => {
    if (!digit || (givens[index] && givens[index] !== digit)) wrong.add(index);
  });
  const wrongParts = [...wrong]
    .sort((a, b) => a - b)
    .map((index) => ({ row: Math.floor(index / SIZE), col: index % SIZE }));
  return { correct: wrongParts.length === 0, wrongParts };
}
