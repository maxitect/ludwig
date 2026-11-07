import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "the-long-way-round",
  title: "The Long Way Round",
  difficulty: 4,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  givens: [
    { row: 0, col: 0, digit: 3 }, { row: 0, col: 2, digit: 8 }, { row: 0, col: 4, digit: 8 },
    { row: 0, col: 6, digit: 3 }, { row: 0, col: 7, digit: 1 }, { row: 0, col: 9, digit: 1 },
    { row: 1, col: 0, digit: 4 }, { row: 1, col: 2, digit: 8 }, { row: 1, col: 3, digit: 8 },
    { row: 1, col: 5, digit: 8 }, { row: 1, col: 8, digit: 4 }, { row: 2, col: 5, digit: 9 },
    { row: 2, col: 7, digit: 9 }, { row: 2, col: 8, digit: 7 }, { row: 2, col: 9, digit: 7 },
    { row: 3, col: 2, digit: 5 }, { row: 3, col: 3, digit: 5 }, { row: 4, col: 1, digit: 5 },
    { row: 4, col: 4, digit: 2 }, { row: 4, col: 6, digit: 9 }, { row: 4, col: 9, digit: 7 },
    { row: 5, col: 3, digit: 2 }, { row: 5, col: 6, digit: 6 }, { row: 5, col: 8, digit: 7 },
    { row: 6, col: 1, digit: 6 }, { row: 6, col: 4, digit: 8 }, { row: 6, col: 5, digit: 8 },
    { row: 6, col: 6, digit: 7 }, { row: 6, col: 8, digit: 6 }, { row: 6, col: 9, digit: 7 },
    { row: 7, col: 0, digit: 5 }, { row: 7, col: 1, digit: 4 }, { row: 7, col: 3, digit: 4 },
    { row: 7, col: 7, digit: 6 }, { row: 7, col: 8, digit: 6 }, { row: 7, col: 9, digit: 5 },
    { row: 8, col: 1, digit: 2 }, { row: 8, col: 2, digit: 4 }, { row: 8, col: 5, digit: 7 },
    { row: 8, col: 7, digit: 7 }, { row: 9, col: 1, digit: 3 }, { row: 9, col: 3, digit: 5 },
    { row: 9, col: 7, digit: 5 }, { row: 9, col: 9, digit: 5 },
  ],
} satisfies Content;

export const generated = { generator: "fillomino", version: 1, seed: "the-long-way-round" } satisfies Provenance;
