import type { Payload, Solution } from "./schema";

/** The solved 6 by 6 grid the fixture puzzle is cut from, one row per string. */
export const SOLVED_ROWS = [
  "XXOOII",
  "IIXXOO",
  "OIXXOI",
  "OOIIXX",
  "IOOIXX",
  "XXIOIO",
] as const;

const SYMBOL_OF = { X: "x", O: "o", I: "i" } as const;

export const solution: Solution = SOLVED_ROWS.flatMap((line, row) =>
  [...line].map((letter, col) => ({
    row,
    col,
    symbol: SYMBOL_OF[letter as keyof typeof SYMBOL_OF],
  })),
);

/** A puzzle with exactly one completion. */
export const payload: Payload = {
  size: 6,
  givens: [
    { row: 0, col: 2, symbol: "o" },
    { row: 1, col: 0, symbol: "i" },
    { row: 1, col: 3, symbol: "x" },
    { row: 2, col: 3, symbol: "x" },
    { row: 3, col: 0, symbol: "o" },
    { row: 3, col: 1, symbol: "o" },
    { row: 3, col: 2, symbol: "i" },
    { row: 4, col: 1, symbol: "o" },
    { row: 4, col: 4, symbol: "x" },
    { row: 4, col: 5, symbol: "x" },
    { row: 5, col: 2, symbol: "i" },
    { row: 5, col: 4, symbol: "i" },
  ],
};
