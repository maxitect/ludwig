import type { Payload, Solution } from "./schema";

/** The circled column of each row of the fixture: one in every row, column and box. */
const CIRCLED_COLS = [0, 3, 6, 1, 4, 7, 2, 5, 8] as const;

/** Row r holds the digit r + 1 in its circled column. */
export const solution: Solution = CIRCLED_COLS.map((col, row) => ({ row, col }));

const circled = CIRCLED_COLS.map((col, row) => ({
  row,
  col,
  digit: row + 1,
}));

/** Nine numbers only, so the nine of them are the one solution. */
export const payload: Payload = { numbers: circled };

/**
 * Two extra numbers that open a second solution: a 1 at (0,1) and a 4 at (3,0)
 * let the circles in rows 0 and 3 swap columns.
 */
export const decoys: Payload["numbers"] = [
  { row: 0, col: 1, digit: 1 },
  { row: 3, col: 0, digit: 4 },
];
