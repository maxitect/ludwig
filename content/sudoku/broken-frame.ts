import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "broken-frame",
  title: "Broken Frame",
  difficulty: 4,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 6, digit: 1 },
    { row: 1, col: 2, digit: 7 }, { row: 1, col: 3, digit: 2 }, { row: 1, col: 6, digit: 8 },
    { row: 2, col: 0, digit: 4 }, { row: 2, col: 4, digit: 9 },
    { row: 3, col: 0, digit: 6 }, { row: 3, col: 2, digit: 3 }, { row: 3, col: 3, digit: 9 }, { row: 3, col: 7, digit: 5 },
    { row: 4, col: 4, digit: 1 }, { row: 4, col: 5, digit: 6 }, { row: 4, col: 7, digit: 9 },
    { row: 5, col: 3, digit: 5 }, { row: 5, col: 4, digit: 4 },
    { row: 6, col: 7, digit: 3 },
    { row: 7, col: 1, digit: 6 }, { row: 7, col: 4, digit: 7 }, { row: 7, col: 8, digit: 2 },
    { row: 8, col: 1, digit: 2 }, { row: 8, col: 6, digit: 9 }, { row: 8, col: 7, digit: 1 },
  ],
  regions: {
    kind: "jigsaw",
    cells: [
      { row: 0, col: 0, region: 0 }, { row: 0, col: 1, region: 0 }, { row: 0, col: 2, region: 0 }, { row: 0, col: 3, region: 0 }, { row: 0, col: 4, region: 0 }, { row: 0, col: 5, region: 8 }, { row: 0, col: 6, region: 8 }, { row: 0, col: 7, region: 8 }, { row: 0, col: 8, region: 8 },
      { row: 1, col: 0, region: 0 }, { row: 1, col: 1, region: 0 }, { row: 1, col: 2, region: 0 }, { row: 1, col: 3, region: 8 }, { row: 1, col: 4, region: 8 }, { row: 1, col: 5, region: 8 }, { row: 1, col: 6, region: 7 }, { row: 1, col: 7, region: 7 }, { row: 1, col: 8, region: 7 },
      { row: 2, col: 0, region: 3 }, { row: 2, col: 1, region: 3 }, { row: 2, col: 2, region: 0 }, { row: 2, col: 3, region: 8 }, { row: 2, col: 4, region: 8 }, { row: 2, col: 5, region: 7 }, { row: 2, col: 6, region: 7 }, { row: 2, col: 7, region: 7 }, { row: 2, col: 8, region: 7 },
      { row: 3, col: 0, region: 3 }, { row: 3, col: 1, region: 3 }, { row: 3, col: 2, region: 3 }, { row: 3, col: 3, region: 3 }, { row: 3, col: 4, region: 3 }, { row: 3, col: 5, region: 6 }, { row: 3, col: 6, region: 6 }, { row: 3, col: 7, region: 6 }, { row: 3, col: 8, region: 7 },
      { row: 4, col: 0, region: 2 }, { row: 4, col: 1, region: 3 }, { row: 4, col: 2, region: 3 }, { row: 4, col: 3, region: 5 }, { row: 4, col: 4, region: 5 }, { row: 4, col: 5, region: 5 }, { row: 4, col: 6, region: 5 }, { row: 4, col: 7, region: 6 }, { row: 4, col: 8, region: 7 },
      { row: 5, col: 0, region: 2 }, { row: 5, col: 1, region: 2 }, { row: 5, col: 2, region: 2 }, { row: 5, col: 3, region: 5 }, { row: 5, col: 4, region: 5 }, { row: 5, col: 5, region: 5 }, { row: 5, col: 6, region: 6 }, { row: 5, col: 7, region: 6 }, { row: 5, col: 8, region: 4 },
      { row: 6, col: 0, region: 2 }, { row: 6, col: 1, region: 2 }, { row: 6, col: 2, region: 1 }, { row: 6, col: 3, region: 1 }, { row: 6, col: 4, region: 5 }, { row: 6, col: 5, region: 5 }, { row: 6, col: 6, region: 6 }, { row: 6, col: 7, region: 4 }, { row: 6, col: 8, region: 4 },
      { row: 7, col: 0, region: 2 }, { row: 7, col: 1, region: 2 }, { row: 7, col: 2, region: 1 }, { row: 7, col: 3, region: 1 }, { row: 7, col: 4, region: 1 }, { row: 7, col: 5, region: 6 }, { row: 7, col: 6, region: 6 }, { row: 7, col: 7, region: 4 }, { row: 7, col: 8, region: 4 },
      { row: 8, col: 0, region: 2 }, { row: 8, col: 1, region: 1 }, { row: 8, col: 2, region: 1 }, { row: 8, col: 3, region: 1 }, { row: 8, col: 4, region: 1 }, { row: 8, col: 5, region: 4 }, { row: 8, col: 6, region: 4 }, { row: 8, col: 7, region: 4 }, { row: 8, col: 8, region: 4 },
    ],
  },
} satisfies Content;
