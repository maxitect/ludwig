import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "cage-match",
  title: "Cage Match",
  difficulty: 2,
  publishedAt: new Date("2026-10-12T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 1, col: 1, digit: 6 }, { row: 3, col: 6, digit: 5 }, { row: 6, col: 8, digit: 2 },
    { row: 8, col: 5, digit: 5 },
  ],
  cages: [
    { sum: 3, cells: [{ row: 0, col: 1 }] },
    { sum: 20, cells: [{ row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 1, col: 3 }] },
    { sum: 2, cells: [{ row: 0, col: 5 }] },
    { sum: 22, cells: [{ row: 0, col: 6 }, { row: 1, col: 5 }, { row: 1, col: 6 }, { row: 2, col: 6 }] },
    { sum: 6, cells: [{ row: 0, col: 7 }, { row: 0, col: 8 }] },
    { sum: 9, cells: [{ row: 0, col: 0 }, { row: 1, col: 0 }] },
    { sum: 13, cells: [{ row: 1, col: 7 }, { row: 2, col: 7 }] },
    { sum: 12, cells: [{ row: 1, col: 8 }, { row: 2, col: 8 }] },
    { sum: 13, cells: [{ row: 1, col: 1 }, { row: 2, col: 1 }] },
    { sum: 7, cells: [{ row: 1, col: 2 }, { row: 2, col: 2 }] },
    { sum: 15, cells: [{ row: 1, col: 4 }, { row: 2, col: 4 }, { row: 2, col: 5 }] },
    { sum: 18, cells: [{ row: 2, col: 0 }, { row: 3, col: 0 }, { row: 4, col: 0 }, { row: 5, col: 0 }] },
    { sum: 13, cells: [{ row: 2, col: 3 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }] },
    { sum: 7, cells: [{ row: 3, col: 4 }] },
    { sum: 17, cells: [{ row: 4, col: 1 }, { row: 4, col: 2 }] },
    { sum: 13, cells: [{ row: 3, col: 5 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 4, col: 5 }] },
    { sum: 26, cells: [{ row: 3, col: 6 }, { row: 3, col: 7 }, { row: 3, col: 8 }, { row: 4, col: 7 }] },
    { sum: 20, cells: [{ row: 5, col: 1 }, { row: 5, col: 2 }, { row: 6, col: 2 }] },
    { sum: 7, cells: [{ row: 5, col: 3 }, { row: 6, col: 3 }] },
    { sum: 24, cells: [{ row: 4, col: 6 }, { row: 5, col: 4 }, { row: 5, col: 5 }, { row: 5, col: 6 }] },
    { sum: 12, cells: [{ row: 4, col: 8 }, { row: 5, col: 7 }, { row: 5, col: 8 }] },
    { sum: 17, cells: [{ row: 6, col: 4 }, { row: 6, col: 5 }, { row: 6, col: 6 }] },
    { sum: 6, cells: [{ row: 6, col: 7 }, { row: 6, col: 8 }, { row: 7, col: 8 }] },
    { sum: 20, cells: [{ row: 6, col: 0 }, { row: 6, col: 1 }, { row: 7, col: 0 }] },
    { sum: 7, cells: [{ row: 7, col: 1 }, { row: 7, col: 2 }] },
    { sum: 22, cells: [{ row: 7, col: 4 }, { row: 7, col: 5 }, { row: 7, col: 6 }, { row: 7, col: 7 }] },
    { sum: 9, cells: [{ row: 8, col: 0 }, { row: 8, col: 1 }] },
    { sum: 18, cells: [{ row: 7, col: 3 }, { row: 8, col: 2 }, { row: 8, col: 3 }] },
    { sum: 8, cells: [{ row: 8, col: 4 }, { row: 8, col: 5 }] },
    { sum: 4, cells: [{ row: 8, col: 6 }] },
    { sum: 15, cells: [{ row: 8, col: 7 }, { row: 8, col: 8 }] },
  ],
} satisfies Content;
