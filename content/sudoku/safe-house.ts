import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "safe-house",
  title: "Safe House",
  difficulty: 4,
  publishedAt: new Date("2026-10-14T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [],
  cages: [
    { sum: 8, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }] },
    { sum: 17, cells: [{ row: 0, col: 2 }, { row: 0, col: 3 }, { row: 1, col: 3 }] },
    { sum: 16, cells: [{ row: 0, col: 4 }, { row: 0, col: 5 }, { row: 0, col: 6 }] },
    { sum: 22, cells: [{ row: 0, col: 7 }, { row: 0, col: 8 }, { row: 1, col: 6 }, { row: 1, col: 7 }] },
    { sum: 20, cells: [{ row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 }] },
    { sum: 9, cells: [{ row: 1, col: 2 }, { row: 2, col: 2 }] },
    { sum: 14, cells: [{ row: 1, col: 4 }, { row: 1, col: 5 }] },
    { sum: 11, cells: [{ row: 1, col: 8 }, { row: 2, col: 8 }] },
    { sum: 14, cells: [{ row: 2, col: 1 }, { row: 3, col: 1 }] },
    { sum: 16, cells: [{ row: 2, col: 7 }, { row: 3, col: 7 }] },
    { sum: 14, cells: [{ row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 }] },
    { sum: 10, cells: [{ row: 2, col: 4 }, { row: 2, col: 5 }, { row: 2, col: 6 }, { row: 3, col: 4 }] },
    { sum: 8, cells: [{ row: 3, col: 5 }, { row: 3, col: 6 }] },
    { sum: 16, cells: [{ row: 3, col: 8 }, { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 5, col: 8 }] },
    { sum: 7, cells: [{ row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }] },
    { sum: 19, cells: [{ row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 }] },
    { sum: 8, cells: [{ row: 5, col: 0 }, { row: 5, col: 1 }] },
    { sum: 22, cells: [{ row: 4, col: 3 }, { row: 5, col: 2 }, { row: 5, col: 3 }] },
    { sum: 18, cells: [{ row: 5, col: 4 }, { row: 5, col: 5 }, { row: 6, col: 4 }] },
    { sum: 15, cells: [{ row: 6, col: 1 }, { row: 6, col: 2 }, { row: 6, col: 3 }] },
    { sum: 11, cells: [{ row: 5, col: 6 }, { row: 6, col: 5 }, { row: 6, col: 6 }] },
    { sum: 12, cells: [{ row: 5, col: 7 }, { row: 6, col: 7 }, { row: 6, col: 8 }] },
    { sum: 8, cells: [{ row: 7, col: 1 }, { row: 7, col: 2 }, { row: 8, col: 2 }] },
    { sum: 25, cells: [{ row: 7, col: 4 }, { row: 7, col: 5 }, { row: 8, col: 5 }, { row: 8, col: 6 }] },
    { sum: 15, cells: [{ row: 7, col: 6 }, { row: 7, col: 7 }, { row: 7, col: 8 }] },
    { sum: 25, cells: [{ row: 6, col: 0 }, { row: 7, col: 0 }, { row: 8, col: 0 }, { row: 8, col: 1 }] },
    { sum: 15, cells: [{ row: 7, col: 3 }, { row: 8, col: 3 }, { row: 8, col: 4 }] },
    { sum: 10, cells: [{ row: 8, col: 7 }, { row: 8, col: 8 }] },
  ],
} satisfies Content;
