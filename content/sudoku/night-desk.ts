import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "night-desk",
  title: "Night Desk",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 0, digit: 7 }, { row: 0, col: 5, digit: 4 }, { row: 1, col: 0, digit: 1 },
    { row: 1, col: 1, digit: 8 }, { row: 1, col: 4, digit: 7 }, { row: 1, col: 8, digit: 3 },
    { row: 2, col: 2, digit: 5 }, { row: 2, col: 3, digit: 1 }, { row: 2, col: 8, digit: 7 },
    { row: 3, col: 1, digit: 2 }, { row: 3, col: 2, digit: 7 }, { row: 3, col: 5, digit: 8 },
    { row: 3, col: 7, digit: 6 }, { row: 4, col: 2, digit: 3 }, { row: 4, col: 6, digit: 8 },
    { row: 5, col: 1, digit: 9 }, { row: 5, col: 3, digit: 7 }, { row: 5, col: 6, digit: 4 },
    { row: 5, col: 7, digit: 5 }, { row: 6, col: 0, digit: 9 }, { row: 6, col: 5, digit: 5 },
    { row: 6, col: 6, digit: 1 }, { row: 7, col: 0, digit: 8 }, { row: 7, col: 4, digit: 3 },
    { row: 7, col: 7, digit: 2 }, { row: 7, col: 8, digit: 4 }, { row: 8, col: 3, digit: 4 },
    { row: 8, col: 8, digit: 5 },
  ],
} satisfies Content;

export const generated = { generator: "sudoku", version: 1, seed: "night-desk" } satisfies Provenance;
