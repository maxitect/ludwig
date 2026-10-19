import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "dead-sum",
  title: "Dead Sum",
  difficulty: 3,
  publishedAt: new Date("2026-10-13T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 4, col: 7, digit: 9 }, { row: 6, col: 1, digit: 9 }, { row: 7, col: 4, digit: 7 },
    { row: 8, col: 5, digit: 9 },
  ],
  cages: [
    { sum: 8, cells: [{ row: 0, col: 0 }] },
    { sum: 3, cells: [{ row: 0, col: 6 }] },
    { sum: 27, cells: [{ row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 7 }, { row: 1, col: 8 }] },
    { sum: 18, cells: [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }] },
    { sum: 10, cells: [{ row: 0, col: 2 }, { row: 1, col: 2 }] },
    { sum: 5, cells: [{ row: 1, col: 4 }] },
    { sum: 10, cells: [{ row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 }, { row: 1, col: 5 }] },
    { sum: 9, cells: [{ row: 2, col: 0 }, { row: 3, col: 0 }, { row: 3, col: 1 }] },
    { sum: 8, cells: [{ row: 2, col: 1 }, { row: 2, col: 2 }] },
    { sum: 33, cells: [{ row: 1, col: 3 }, { row: 2, col: 3 }, { row: 3, col: 3 }, { row: 4, col: 3 }, { row: 5, col: 3 }] },
    { sum: 21, cells: [{ row: 1, col: 6 }, { row: 2, col: 6 }, { row: 2, col: 7 }, { row: 2, col: 8 }, { row: 3, col: 6 }] },
    { sum: 16, cells: [{ row: 2, col: 4 }, { row: 2, col: 5 }, { row: 3, col: 5 }, { row: 4, col: 5 }] },
    { sum: 5, cells: [{ row: 3, col: 7 }, { row: 3, col: 8 }] },
    { sum: 10, cells: [{ row: 4, col: 0 }, { row: 4, col: 1 }] },
    { sum: 17, cells: [{ row: 3, col: 2 }, { row: 4, col: 2 }] },
    { sum: 24, cells: [{ row: 3, col: 4 }, { row: 4, col: 4 }, { row: 5, col: 4 }, { row: 6, col: 4 }] },
    { sum: 21, cells: [{ row: 4, col: 6 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 5, col: 7 }] },
    { sum: 1, cells: [{ row: 5, col: 1 }] },
    { sum: 15, cells: [{ row: 5, col: 6 }, { row: 6, col: 6 }] },
    { sum: 26, cells: [{ row: 5, col: 0 }, { row: 6, col: 0 }, { row: 6, col: 1 }, { row: 7, col: 1 }] },
    { sum: 7, cells: [{ row: 5, col: 2 }, { row: 6, col: 2 }] },
    { sum: 6, cells: [{ row: 6, col: 3 }] },
    { sum: 14, cells: [{ row: 5, col: 5 }, { row: 6, col: 5 }] },
    { sum: 7, cells: [{ row: 7, col: 0 }, { row: 8, col: 0 }] },
    { sum: 17, cells: [{ row: 7, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 2 }, { row: 8, col: 3 }] },
    { sum: 24, cells: [{ row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 }, { row: 8, col: 4 }, { row: 8, col: 5 }] },
    { sum: 22, cells: [{ row: 7, col: 6 }, { row: 7, col: 7 }, { row: 8, col: 6 }, { row: 8, col: 7 }] },
    { sum: 21, cells: [{ row: 5, col: 8 }, { row: 6, col: 7 }, { row: 6, col: 8 }, { row: 7, col: 8 }, { row: 8, col: 8 }] },
  ],
} satisfies Content;
