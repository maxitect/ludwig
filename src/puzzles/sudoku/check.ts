import { conflictingIndexes, gridFromGivens, type Grid } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

const SIZE = 9;

/**
 * Any completion that respects the givens and repeats no digit in a row, column or box is correct.
 * Wrong cells are the ones that break a rule or overwrite a given, never a comparison with the solution.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const givens = gridFromGivens(payload.givens);
  const grid: Grid = Array(SIZE * SIZE).fill(0);
  for (const { row, col, digit } of answer.cells) grid[row * SIZE + col] = digit;
  const wrong = conflictingIndexes(grid);
  grid.forEach((digit, index) => {
    if (!digit || (givens[index] && givens[index] !== digit)) wrong.add(index);
  });
  const wrongCells = [...wrong]
    .sort((a, b) => a - b)
    .map((index) => ({ row: Math.floor(index / SIZE), col: index % SIZE }));
  return { correct: wrongCells.length === 0, wrongCells };
}

export function checkCell(
  _payload: Payload,
  solution: Solution,
  row: number,
  col: number,
  value: string,
) {
  const cell = solution.find((c) => c.row === row && c.col === col);
  return { correct: cell !== undefined && String(cell.digit) === value };
}

export function revealCell(solution: Solution, row: number, col: number) {
  const cell = solution.find((c) => c.row === row && c.col === col);
  return cell ? String(cell.digit) : null;
}
