import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "borrowed-time",
  title: "Borrowed Time",
  difficulty: 3,
  publishedAt: new Date("2026-10-18T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  givens: [
    { row: 0, col: 5, digit: 8 },
    { row: 0, col: 6, digit: 5 },
    { row: 0, col: 7, digit: 1 },
    { row: 1, col: 0, digit: 1 },
    { row: 1, col: 2, digit: 5 },
    { row: 1, col: 7, digit: 5 },
    { row: 2, col: 2, digit: 3 },
    { row: 2, col: 3, digit: 8 },
    { row: 2, col: 4, digit: 8 },
    { row: 2, col: 5, digit: 5 },
    { row: 3, col: 0, digit: 5 },
    { row: 3, col: 2, digit: 3 },
    { row: 3, col: 4, digit: 7 },
    { row: 3, col: 5, digit: 1 },
    { row: 4, col: 0, digit: 1 },
    { row: 4, col: 1, digit: 4 },
    { row: 4, col: 2, digit: 3 },
    { row: 4, col: 3, digit: 7 },
    { row: 4, col: 5, digit: 9 },
    { row: 4, col: 6, digit: 9 },
    { row: 4, col: 7, digit: 9 },
    { row: 5, col: 0, digit: 4 },
    { row: 5, col: 1, digit: 4 },
    { row: 5, col: 4, digit: 9 },
    { row: 5, col: 5, digit: 9 },
    { row: 6, col: 0, digit: 5 },
    { row: 6, col: 2, digit: 1 },
    { row: 6, col: 3, digit: 7 },
    { row: 6, col: 4, digit: 3 },
    { row: 6, col: 7, digit: 1 },
    { row: 7, col: 6, digit: 7 },
  ],
} satisfies Content;
