import { conflictingIndexes, gridFromGivens, type Grid } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any completion that respects the givens, repeats no digit in a row or column and obeys every
 * inequality is correct. Wrong cells are the ones that break a rule, overwrite a given or hold a digit
 * the grid cannot use, never a comparison with the solution.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const { size, givens, inequalities } = payload;
  const given = gridFromGivens(size, givens);
  const grid: Grid = Array(size * size).fill(0);
  const wrong = new Set<number>();
  for (const { row, col, digit } of answer.cells) {
    if (row >= size || col >= size) continue;
    const index = row * size + col;
    if (digit > size) wrong.add(index);
    else grid[index] = digit;
  }
  for (const index of conflictingIndexes(size, inequalities, grid)) {
    wrong.add(index);
  }
  grid.forEach((digit, index) => {
    if (!digit || (given[index] && given[index] !== digit)) wrong.add(index);
  });
  const cellsWrong = [...wrong]
    .sort((a, b) => a - b)
    .map((index) => ({ row: Math.floor(index / size), col: index % size }));
  return { correct: cellsWrong.length === 0, cellsWrong };
}
