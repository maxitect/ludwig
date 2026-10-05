import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "locked-room",
  title: "Locked Room",
  difficulty: 4,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 1, digit: 8 }, { row: 0, col: 2, digit: 3 }, { row: 0, col: 6, digit: 4 }, { row: 0, col: 7, digit: 7 },
    { row: 1, col: 3, digit: 6 }, { row: 1, col: 6, digit: 1 }, { row: 1, col: 7, digit: 8 },
    { row: 2, col: 4, digit: 1 },
    { row: 3, col: 1, digit: 2 }, { row: 3, col: 2, digit: 9 },
    { row: 4, col: 0, digit: 5 }, { row: 4, col: 4, digit: 6 }, { row: 4, col: 5, digit: 2 }, { row: 4, col: 7, digit: 4 }, { row: 4, col: 8, digit: 7 },
    { row: 5, col: 6, digit: 6 },
    { row: 6, col: 0, digit: 8 }, { row: 6, col: 6, digit: 7 }, { row: 6, col: 8, digit: 2 },
    { row: 7, col: 1, digit: 6 }, { row: 7, col: 3, digit: 4 }, { row: 7, col: 5, digit: 3 }, { row: 7, col: 7, digit: 5 }, { row: 7, col: 8, digit: 1 },
    { row: 8, col: 5, digit: 6 }, { row: 8, col: 6, digit: 8 },
  ],
} satisfies Content;
