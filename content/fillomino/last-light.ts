import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "last-light",
  title: "Last Light",
  difficulty: 5,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  givens: [
    { row: 0, col: 1, digit: 7 }, { row: 0, col: 4, digit: 5 }, { row: 0, col: 7, digit: 1 },
    { row: 1, col: 2, digit: 7 }, { row: 2, col: 0, digit: 6 }, { row: 2, col: 1, digit: 6 },
    { row: 2, col: 3, digit: 7 }, { row: 2, col: 5, digit: 5 }, { row: 2, col: 8, digit: 4 },
    { row: 3, col: 2, digit: 2 }, { row: 3, col: 3, digit: 6 }, { row: 3, col: 6, digit: 3 },
    { row: 3, col: 7, digit: 8 }, { row: 3, col: 9, digit: 3 }, { row: 4, col: 0, digit: 4 },
    { row: 4, col: 1, digit: 3 }, { row: 4, col: 2, digit: 3 }, { row: 4, col: 3, digit: 4 },
    { row: 4, col: 5, digit: 6 }, { row: 4, col: 7, digit: 4 }, { row: 5, col: 4, digit: 4 },
    { row: 5, col: 5, digit: 7 }, { row: 5, col: 8, digit: 5 }, { row: 6, col: 1, digit: 4 },
    { row: 6, col: 2, digit: 8 }, { row: 6, col: 4, digit: 4 }, { row: 6, col: 8, digit: 5 },
    { row: 7, col: 3, digit: 9 }, { row: 7, col: 5, digit: 3 }, { row: 7, col: 6, digit: 3 },
    { row: 7, col: 8, digit: 5 }, { row: 7, col: 9, digit: 1 }, { row: 8, col: 0, digit: 2 },
    { row: 8, col: 1, digit: 9 }, { row: 8, col: 9, digit: 2 }, { row: 9, col: 0, digit: 9 },
    { row: 9, col: 4, digit: 3 }, { row: 9, col: 7, digit: 4 },
  ],
} satisfies Content;

export const generated = { generator: "fillomino", version: 1, seed: "last-light" } satisfies Provenance;
