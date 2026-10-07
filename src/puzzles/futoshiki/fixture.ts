import type { Payload, Solution } from "./schema";

const parse = (lines: string[]) =>
  lines.flatMap((line, row) =>
    [...line].map((char, col) => ({ row, col, digit: Number(char) })),
  );

/** A 4 by 4 puzzle with exactly one completion, worked out by hand. */
export const payload: Payload = {
  size: 4,
  givens: [
    { row: 0, col: 0, digit: 1 },
    { row: 2, col: 2, digit: 4 },
    { row: 1, col: 0, digit: 3 },
  ],
  inequalities: [
    { row: 0, col: 1, direction: "right", relation: "lt" },
    { row: 1, col: 0, direction: "right", relation: "lt" },
    { row: 1, col: 2, direction: "down", relation: "lt" },
    { row: 2, col: 0, direction: "down", relation: "lt" },
    { row: 3, col: 1, direction: "right", relation: "gt" },
    { row: 0, col: 3, direction: "down", relation: "gt" },
    { row: 0, col: 0, direction: "down", relation: "lt" },
    { row: 1, col: 1, direction: "right", relation: "gt" },
    { row: 1, col: 2, direction: "right", relation: "lt" },
  ],
};

export const solution: Solution = parse([
  "1234",
  "3412",
  "2143",
  "4321",
]);
