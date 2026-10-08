import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "side-door",
  title: "Side Door",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 1, digit: 3 }, { row: 0, col: 5, digit: 1 }, { row: 0, col: 7, digit: 5 },
    { row: 1, col: 0, digit: 2 }, { row: 1, col: 5, digit: 4 }, { row: 1, col: 6, digit: 1 },
    { row: 2, col: 1, digit: 9 }, { row: 2, col: 2, digit: 1 }, { row: 2, col: 3, digit: 5 },
    { row: 2, col: 8, digit: 4 }, { row: 3, col: 4, digit: 1 }, { row: 3, col: 6, digit: 2 },
    { row: 4, col: 2, digit: 8 }, { row: 4, col: 4, digit: 5 }, { row: 4, col: 6, digit: 4 },
    { row: 5, col: 2, digit: 2 }, { row: 5, col: 4, digit: 6 }, { row: 6, col: 0, digit: 3 },
    { row: 6, col: 5, digit: 2 }, { row: 6, col: 6, digit: 9 }, { row: 6, col: 7, digit: 7 },
    { row: 7, col: 2, digit: 9 }, { row: 7, col: 3, digit: 1 }, { row: 7, col: 8, digit: 8 },
    { row: 8, col: 1, digit: 4 }, { row: 8, col: 3, digit: 9 }, { row: 8, col: 7, digit: 3 },
  ],
} satisfies Content;

export const generated = { generator: "sudoku", version: 1, seed: "side-door" } satisfies Provenance;
