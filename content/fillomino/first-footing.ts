import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "first-footing",
  title: "First Footing",
  difficulty: 1,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  givens: [
    { row: 0, col: 3, digit: 5 },
    { row: 0, col: 4, digit: 5 },
    { row: 0, col: 5, digit: 1 },
    { row: 1, col: 2, digit: 2 },
    { row: 1, col: 3, digit: 5 },
    { row: 2, col: 2, digit: 6 },
    { row: 2, col: 3, digit: 5 },
    { row: 2, col: 4, digit: 3 },
    { row: 3, col: 1, digit: 5 },
    { row: 3, col: 2, digit: 1 },
    { row: 3, col: 3, digit: 6 },
    { row: 4, col: 0, digit: 5 },
    { row: 4, col: 2, digit: 5 },
    { row: 4, col: 3, digit: 7 },
    { row: 4, col: 4, digit: 6 },
  ],
} satisfies Content;
