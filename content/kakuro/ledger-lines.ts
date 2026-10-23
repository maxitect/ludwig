import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "ledger-lines",
  title: "Ledger Lines",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  cells: [
    { row: 1, col: 1, digit: 6 }, { row: 1, col: 2, digit: 1 }, { row: 1, col: 4, digit: 9 }, { row: 1, col: 5, digit: 2 },
    { row: 2, col: 1, digit: 9 }, { row: 2, col: 2, digit: 8 }, { row: 2, col: 4, digit: 8 }, { row: 2, col: 5, digit: 6 }, { row: 2, col: 6, digit: 7 },
    { row: 3, col: 4, digit: 6 }, { row: 3, col: 5, digit: 1 }, { row: 3, col: 6, digit: 8 },
    { row: 4, col: 1, digit: 9 }, { row: 4, col: 2, digit: 7 }, { row: 4, col: 4, digit: 7 }, { row: 4, col: 5, digit: 4 }, { row: 4, col: 6, digit: 9 },
    { row: 5, col: 1, digit: 8 }, { row: 5, col: 2, digit: 9 }, { row: 5, col: 4, digit: 4 }, { row: 5, col: 5, digit: 3 }, { row: 5, col: 6, digit: 6 },
    { row: 6, col: 1, digit: 1 }, { row: 6, col: 2, digit: 3 },
  ],
} satisfies Content;
