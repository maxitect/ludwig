import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "lamp-and-lens",
  title: "Lamp and Lens",
  difficulty: 2,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  givens: [
    { row: 0, col: 1, digit: 5 },
    { row: 0, col: 3, digit: 9 },
    { row: 0, col: 6, digit: 2 },
    { row: 1, col: 1, digit: 5 },
    { row: 1, col: 3, digit: 2 },
    { row: 2, col: 1, digit: 3 },
    { row: 2, col: 3, digit: 1 },
    { row: 2, col: 5, digit: 2 },
    { row: 3, col: 2, digit: 4 },
    { row: 3, col: 4, digit: 9 },
    { row: 3, col: 5, digit: 9 },
    { row: 4, col: 0, digit: 3 },
    { row: 4, col: 2, digit: 4 },
    { row: 4, col: 4, digit: 8 },
    { row: 4, col: 6, digit: 6 },
    { row: 5, col: 0, digit: 2 },
    { row: 5, col: 1, digit: 3 },
    { row: 5, col: 4, digit: 1 },
    { row: 5, col: 6, digit: 6 },
    { row: 6, col: 2, digit: 8 },
    { row: 6, col: 4, digit: 8 },
    { row: 6, col: 6, digit: 1 },
  ],
} satisfies Content;
