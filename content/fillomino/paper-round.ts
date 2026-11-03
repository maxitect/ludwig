import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "paper-round",
  title: "Paper Round",
  difficulty: 4,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  givens: [
    { row: 0, col: 0, digit: 5 }, { row: 0, col: 2, digit: 6 }, { row: 0, col: 8, digit: 7 },
    { row: 1, col: 5, digit: 8 }, { row: 1, col: 6, digit: 7 }, { row: 1, col: 7, digit: 6 },
    { row: 2, col: 2, digit: 8 }, { row: 2, col: 8, digit: 6 }, { row: 3, col: 1, digit: 5 },
    { row: 3, col: 4, digit: 4 }, { row: 3, col: 6, digit: 4 }, { row: 3, col: 7, digit: 3 },
    { row: 3, col: 8, digit: 5 }, { row: 4, col: 2, digit: 8 }, { row: 4, col: 3, digit: 7 },
    { row: 4, col: 4, digit: 7 }, { row: 4, col: 7, digit: 5 }, { row: 4, col: 9, digit: 9 },
    { row: 5, col: 1, digit: 6 }, { row: 5, col: 2, digit: 7 }, { row: 5, col: 7, digit: 5 },
    { row: 6, col: 1, digit: 5 }, { row: 6, col: 6, digit: 9 }, { row: 6, col: 9, digit: 4 },
    { row: 7, col: 0, digit: 4 }, { row: 7, col: 1, digit: 5 }, { row: 7, col: 2, digit: 5 },
    { row: 7, col: 5, digit: 2 }, { row: 7, col: 6, digit: 8 }, { row: 7, col: 7, digit: 9 },
    { row: 7, col: 8, digit: 9 }, { row: 8, col: 1, digit: 4 }, { row: 8, col: 2, digit: 6 },
    { row: 8, col: 4, digit: 5 }, { row: 9, col: 3, digit: 6 }, { row: 9, col: 5, digit: 5 },
    { row: 9, col: 9, digit: 4 },
  ],
} satisfies Content;

export const generated = { generator: "fillomino", version: 1, seed: "paper-round" } satisfies Provenance;
