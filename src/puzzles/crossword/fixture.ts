import type { Content } from "./schema";

/**
 * A hand-numbered 5x5 grid. Blocks sit at (1,1), (1,3), (3,1) and (3,3), so the runs and numbers are:
 * 1 across and 1 down at (0,0), 2 down at (0,2), 3 down at (0,4), 4 across at (2,0) and 5 across at (4,0).
 */
const rows = ["CRANE", "L#R#V", "ASHES", "S#P#E", "PLAIN"];

export const cells: Content["cells"] = rows.flatMap((word, row) =>
  [...word].flatMap((letter, col) =>
    letter === "#" ? [] : [{ row, col, letter }],
  ),
);

const clue = (
  direction: "across" | "down",
  row: number,
  col: number,
  clueText: string,
  segments: number[] = [5],
) => ({ direction, row, col, clueText, segments });

export const clues: Content["clues"] = [
  clue("across", 0, 0, "A tall wading bird, or a lifting machine"),
  clue("down", 0, 0, "Grip tightly"),
  clue("down", 0, 2, "Unlikely sequence of letters"),
  clue("down", 0, 4, "Unlikely sequence, again"),
  clue("across", 2, 0, "Remains of a fire"),
  clue("across", 4, 0, "Ordinary, without frills"),
];

export const fixture = {
  style: "quick",
  rows: 5,
  cols: 5,
  cells,
  clues,
} satisfies Content;
