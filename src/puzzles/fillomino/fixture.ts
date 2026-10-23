import type { Payload, Solution } from "./schema";

/** The solved 6 by 6 grid the fixture puzzle is cut from, one row per string. */
export const SOLVED_ROWS = [
  "665551",
  "622533",
  "666536",
  "551666",
  "555766",
  "777777",
] as const;

export const solution: Solution = SOLVED_ROWS.flatMap((line, row) =>
  [...line].map((digit, col) => ({ row, col, digit: Number(digit) })),
);

/** A puzzle with exactly one completion. */
export const payload: Payload = {
  rows: 6,
  cols: 6,
  givens: [
    { row: 0, col: 3, digit: 5 },
    { row: 0, col: 4, digit: 5 },
    { row: 0, col: 5, digit: 1 },
    { row: 1, col: 2, digit: 2 },
    { row: 1, col: 3, digit: 5 },
    { row: 2, col: 2, digit: 6 },
    { row: 2, col: 3, digit: 5 },
    { row: 2, col: 4, digit: 3 },
    { row: 3, col: 1, digit: 5 },
    { row: 3, col: 2, digit: 1 },
    { row: 3, col: 3, digit: 6 },
    { row: 4, col: 0, digit: 5 },
    { row: 4, col: 2, digit: 5 },
    { row: 4, col: 3, digit: 7 },
    { row: 4, col: 4, digit: 6 },
  ],
};
