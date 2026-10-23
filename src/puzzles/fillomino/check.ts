import { brokenIndexes, gridFromGivens, type Grid } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any filled grid that keeps the givens, gives every area as many cells as its digit and never
 * lets two areas of one size touch is correct. The puzzle has one such grid, so nothing is compared
 * with the solution. Wrong cells are the ones in an area of the wrong size, a changed given or an empty cell.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const { rows, cols, givens } = payload;
  const layout = { rows, cols };
  const given = gridFromGivens(layout, givens);
  const grid: Grid = Array(rows * cols).fill(0);
  for (const { row, col, digit } of answer.cells) {
    if (row < rows && col < cols) grid[row * cols + col] = digit;
  }
  const wrong = brokenIndexes(layout, grid);
  grid.forEach((digit, index) => {
    if (!digit || (given[index] && given[index] !== digit)) wrong.add(index);
  });
  const wrongParts = [...wrong]
    .sort((a, b) => a - b)
    .map((index) => ({ row: Math.floor(index / cols), col: index % cols }));
  return { correct: wrongParts.length === 0, wrongParts };
}
