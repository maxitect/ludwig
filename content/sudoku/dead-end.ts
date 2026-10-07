import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "dead-end",
  title: "Dead End",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 5, digit: 8 }, { row: 0, col: 8, digit: 9 },
    { row: 1, col: 2, digit: 5 }, { row: 1, col: 6, digit: 2 }, { row: 1, col: 7, digit: 7 },
    { row: 2, col: 4, digit: 6 }, { row: 2, col: 5, digit: 9 }, { row: 2, col: 7, digit: 1 },
    { row: 3, col: 0, digit: 5 }, { row: 3, col: 2, digit: 3 }, { row: 3, col: 4, digit: 1 }, { row: 3, col: 8, digit: 6 },
    { row: 4, col: 1, digit: 6 }, { row: 4, col: 7, digit: 8 },
    { row: 5, col: 0, digit: 1 }, { row: 5, col: 2, digit: 8 }, { row: 5, col: 8, digit: 4 },
    { row: 6, col: 0, digit: 9 }, { row: 6, col: 3, digit: 2 }, { row: 6, col: 6, digit: 8 }, { row: 6, col: 8, digit: 7 },
    { row: 7, col: 2, digit: 6 }, { row: 7, col: 5, digit: 5 }, { row: 7, col: 7, digit: 2 },
    { row: 8, col: 0, digit: 3 },
  ],
} satisfies Content;
