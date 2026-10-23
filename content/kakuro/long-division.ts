import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "long-division",
  title: "Long Division",
  difficulty: 5,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  cells: [
    { row: 1, col: 1, digit: 7 }, { row: 1, col: 2, digit: 6 }, { row: 1, col: 5, digit: 8 }, { row: 1, col: 6, digit: 9 },
    { row: 2, col: 1, digit: 9 }, { row: 2, col: 2, digit: 5 }, { row: 2, col: 3, digit: 8 }, { row: 2, col: 5, digit: 9 }, { row: 2, col: 6, digit: 7 }, { row: 2, col: 7, digit: 6 },
    { row: 3, col: 2, digit: 2 }, { row: 3, col: 3, digit: 1 }, { row: 3, col: 5, digit: 2 }, { row: 3, col: 6, digit: 4 }, { row: 3, col: 7, digit: 1 },
    { row: 4, col: 3, digit: 2 }, { row: 4, col: 4, digit: 9 }, { row: 4, col: 7, digit: 2 }, { row: 4, col: 8, digit: 8 }, { row: 4, col: 9, digit: 5 },
    { row: 5, col: 1, digit: 7 }, { row: 5, col: 2, digit: 1 }, { row: 5, col: 4, digit: 3 }, { row: 5, col: 5, digit: 7 }, { row: 5, col: 6, digit: 1 }, { row: 5, col: 8, digit: 9 }, { row: 5, col: 9, digit: 3 },
    { row: 6, col: 1, digit: 1 }, { row: 6, col: 2, digit: 4 }, { row: 6, col: 3, digit: 2 }, { row: 6, col: 5, digit: 9 }, { row: 6, col: 6, digit: 4 }, { row: 6, col: 7, digit: 7 },
    { row: 7, col: 1, digit: 8 }, { row: 7, col: 2, digit: 6 }, { row: 7, col: 3, digit: 9 }, { row: 7, col: 6, digit: 2 }, { row: 7, col: 7, digit: 1 }, { row: 7, col: 8, digit: 8 },
    { row: 8, col: 7, digit: 4 }, { row: 8, col: 8, digit: 9 }, { row: 8, col: 9, digit: 6 },
    { row: 9, col: 8, digit: 4 }, { row: 9, col: 9, digit: 1 },
  ],
} satisfies Content;
