import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "cross-purposes",
  title: "Cross Purposes",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  cells: [
    { row: 1, col: 1, digit: 5 }, { row: 1, col: 2, digit: 3 }, { row: 1, col: 3, digit: 4 }, { row: 1, col: 4, digit: 2 }, { row: 1, col: 5, digit: 1 },
    { row: 2, col: 1, digit: 6 }, { row: 2, col: 2, digit: 7 }, { row: 2, col: 3, digit: 9 }, { row: 2, col: 4, digit: 4 }, { row: 2, col: 5, digit: 3 },
    { row: 3, col: 3, digit: 3 }, { row: 3, col: 4, digit: 1 }, { row: 3, col: 6, digit: 3 }, { row: 3, col: 7, digit: 8 },
    { row: 4, col: 1, digit: 2 }, { row: 4, col: 2, digit: 9 }, { row: 4, col: 3, digit: 6 }, { row: 4, col: 5, digit: 2 }, { row: 4, col: 6, digit: 1 }, { row: 4, col: 7, digit: 9 },
    { row: 5, col: 1, digit: 1 }, { row: 5, col: 2, digit: 5 }, { row: 5, col: 3, digit: 8 }, { row: 5, col: 4, digit: 7 }, { row: 5, col: 5, digit: 4 },
    { row: 6, col: 1, digit: 4 }, { row: 6, col: 2, digit: 8 }, { row: 6, col: 4, digit: 6 }, { row: 6, col: 5, digit: 1 },
    { row: 7, col: 1, digit: 3 }, { row: 7, col: 2, digit: 6 },
  ],
} satisfies Content;
