import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "back-room",
  title: "Back Room",
  difficulty: 5,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 0, digit: 3 }, { row: 0, col: 4, digit: 5 }, { row: 0, col: 7, digit: 1 },
    { row: 1, col: 2, digit: 4 },
    { row: 2, col: 0, digit: 6 }, { row: 2, col: 4, digit: 9 }, { row: 2, col: 6, digit: 8 }, { row: 2, col: 8, digit: 7 },
    { row: 3, col: 0, digit: 5 }, { row: 3, col: 1, digit: 4 }, { row: 3, col: 5, digit: 9 }, { row: 3, col: 6, digit: 3 },
    { row: 4, col: 0, digit: 7 }, { row: 4, col: 1, digit: 2 }, { row: 4, col: 4, digit: 4 }, { row: 4, col: 5, digit: 5 }, { row: 4, col: 6, digit: 1 }, { row: 4, col: 8, digit: 8 },
    { row: 5, col: 3, digit: 3 }, { row: 5, col: 4, digit: 2 }, { row: 5, col: 7, digit: 5 },
    { row: 6, col: 0, digit: 4 }, { row: 6, col: 1, digit: 1 }, { row: 6, col: 4, digit: 3 }, { row: 6, col: 5, digit: 8 },
    { row: 7, col: 0, digit: 8 }, { row: 7, col: 2, digit: 9 }, { row: 7, col: 3, digit: 7 }, { row: 7, col: 4, digit: 6 },
    { row: 8, col: 1, digit: 6 }, { row: 8, col: 2, digit: 7 }, { row: 8, col: 4, digit: 1 }, { row: 8, col: 7, digit: 8 }, { row: 8, col: 8, digit: 3 },
  ],
} satisfies Content;
