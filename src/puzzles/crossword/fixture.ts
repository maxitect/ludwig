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

/**
 * A hand-numbered 15x15 cryptic grid with a (4,3) enumeration. Runs and numbers:
 * 1 across and down at (0,0), 2 down at (0,2), 3 down at (0,4), 4 down at (0,6), 5 across and down at (0,8),
 * 6, 7 and 8 down at (0,10), (0,12) and (0,14), then 9 across at (2,0) and 10 across at (2,8).
 */
const crypticRows = [
  "CRYPTIC#ENIGMAS",
  "L#U#E#R#N#D#A#I",
  "UNSOLVE#DECODED",
  ...Array.from({ length: 12 }, () => "#".repeat(15)),
];

export const crypticCells: Content["cells"] = crypticRows.flatMap((word, row) =>
  [...word].flatMap((letter, col) =>
    letter === "#" ? [] : [{ row, col, letter }],
  ),
);

export const crypticClues: Content["clues"] = [
  clue("across", 0, 0, "Puzzle with hidden meanings, in the main", [4, 3]),
  clue("down", 0, 0, "Fragment of evidence", [3]),
  clue("down", 0, 2, "Gloomy start to a cipher", [3]),
  clue("down", 0, 4, "Enclosure in the middle", [3]),
  clue("down", 0, 6, "Backward tone", [3]),
  clue("across", 0, 8, "Riddles that baffle", [7]),
  clue("down", 0, 8, "Fixed quantity", [3]),
  clue("down", 0, 10, "Wild goose chase", [3]),
  clue("down", 0, 12, "Silent letter", [3]),
  clue("down", 0, 14, "Edge of a ledger", [3]),
  clue("across", 2, 0, "Unpick something tricky", [7]),
  clue("across", 2, 8, "Translated from cipher", [7]),
];

export const crypticFixture = {
  style: "cryptic",
  rows: 15,
  cols: 15,
  cells: crypticCells,
  clues: crypticClues,
} satisfies Content;
