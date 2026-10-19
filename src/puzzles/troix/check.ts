import { conflictingIndexes, gridFromGivens, symbolCode, type Grid } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any completion that respects the givens, never runs three alike and holds `size / 3` of each symbol
 * in every row and column is correct. Wrong cells are the ones that break a rule, overwrite a given
 * or are left empty, never a comparison with the solution.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const { size, givens } = payload;
  const given = gridFromGivens(size, givens);
  const grid: Grid = Array(size * size).fill(0);
  for (const { row, col, symbol } of answer.cells) {
    if (row < size && col < size) grid[row * size + col] = symbolCode(symbol);
  }
  const wrong = conflictingIndexes(size, grid);
  grid.forEach((code, index) => {
    if (!code || (given[index] && given[index] !== code)) wrong.add(index);
  });
  const wrongParts = [...wrong]
    .sort((a, b) => a - b)
    .map((index) => ({ row: Math.floor(index / size), col: index % size }));
  return { correct: wrongParts.length === 0, wrongParts };
}
