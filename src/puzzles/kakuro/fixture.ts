import { deriveClues } from "./derive";
import type { Content, Payload, Solution } from "./schema";

/** Digits 1 3 / 2 1 in a 2x2 block with the clue row and column around it: the only way to make 4, 3, 3 and 4. */
export const solution: Solution = [
  { row: 1, col: 1, digit: 1 },
  { row: 1, col: 2, digit: 3 },
  { row: 2, col: 1, digit: 2 },
  { row: 2, col: 2, digit: 1 },
];

export const content: Content = { rows: 5, cols: 5, cells: solution };

export const payload: Payload = {
  rows: 5,
  cols: 5,
  cells: solution.map(({ row, col }) => ({ row, col })),
  clues: deriveClues(solution),
};

/** Digits 1 2 / 2 1 swap with 2 1 / 1 2, so every sum is 3 and there are two solutions. */
export const ambiguous: Solution = [
  { row: 1, col: 1, digit: 1 },
  { row: 1, col: 2, digit: 2 },
  { row: 2, col: 1, digit: 2 },
  { row: 2, col: 2, digit: 1 },
];
