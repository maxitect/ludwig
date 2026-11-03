import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "glass-house",
  title: "Glass House",
  difficulty: 1,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  givens: [
    { row: 0, col: 2, digit: 5 }, { row: 0, col: 4, digit: 3 }, { row: 0, col: 5, digit: 7 },
    { row: 0, col: 6, digit: 7 }, { row: 0, col: 7, digit: 7 }, { row: 1, col: 0, digit: 2 },
    { row: 1, col: 1, digit: 5 }, { row: 1, col: 2, digit: 5 }, { row: 1, col: 4, digit: 5 },
    { row: 1, col: 5, digit: 7 }, { row: 1, col: 6, digit: 7 }, { row: 2, col: 2, digit: 4 },
    { row: 2, col: 3, digit: 5 }, { row: 2, col: 5, digit: 5 }, { row: 2, col: 6, digit: 4 },
    { row: 3, col: 2, digit: 8 }, { row: 3, col: 3, digit: 3 }, { row: 3, col: 7, digit: 4 },
    { row: 4, col: 1, digit: 8 }, { row: 5, col: 0, digit: 8 }, { row: 5, col: 2, digit: 8 },
    { row: 5, col: 3, digit: 7 }, { row: 5, col: 5, digit: 7 }, { row: 5, col: 7, digit: 3 },
    { row: 6, col: 0, digit: 1 }, { row: 6, col: 1, digit: 8 }, { row: 6, col: 2, digit: 7 },
    { row: 6, col: 3, digit: 7 }, { row: 6, col: 4, digit: 7 }, { row: 6, col: 5, digit: 5 },
    { row: 6, col: 6, digit: 2 }, { row: 7, col: 0, digit: 2 }, { row: 7, col: 4, digit: 3 },
  ],
} satisfies Content;

export const generated = { generator: "fillomino", version: 1, seed: "glass-house" } satisfies Provenance;
