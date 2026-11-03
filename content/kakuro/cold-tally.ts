import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "cold-tally",
  title: "Cold Tally",
  difficulty: 4,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 9,
  cells: [
    { row: 1, col: 1, digit: 9 }, { row: 1, col: 2, digit: 3 }, { row: 1, col: 3, digit: 1 },
    { row: 1, col: 6, digit: 1 }, { row: 1, col: 7, digit: 9 }, { row: 2, col: 1, digit: 5 },
    { row: 2, col: 2, digit: 2 }, { row: 2, col: 3, digit: 3 }, { row: 2, col: 4, digit: 1 },
    { row: 2, col: 6, digit: 2 }, { row: 2, col: 7, digit: 7 }, { row: 3, col: 2, digit: 5 },
    { row: 3, col: 3, digit: 4 }, { row: 3, col: 4, digit: 6 }, { row: 3, col: 5, digit: 3 },
    { row: 3, col: 6, digit: 9 }, { row: 4, col: 1, digit: 3 }, { row: 4, col: 2, digit: 1 },
    { row: 4, col: 4, digit: 2 }, { row: 4, col: 5, digit: 1 }, { row: 4, col: 7, digit: 8 },
    { row: 4, col: 8, digit: 9 }, { row: 5, col: 1, digit: 1 }, { row: 5, col: 2, digit: 4 },
    { row: 5, col: 3, digit: 8 }, { row: 5, col: 5, digit: 4 }, { row: 5, col: 6, digit: 5 },
    { row: 5, col: 7, digit: 1 }, { row: 5, col: 8, digit: 2 }, { row: 6, col: 3, digit: 1 },
    { row: 6, col: 4, digit: 8 }, { row: 6, col: 5, digit: 2 }, { row: 6, col: 6, digit: 3 },
    { row: 7, col: 2, digit: 8 }, { row: 7, col: 3, digit: 9 }, { row: 7, col: 4, digit: 7 },
    { row: 7, col: 6, digit: 4 }, { row: 7, col: 7, digit: 2 }, { row: 8, col: 1, digit: 4 },
    { row: 8, col: 2, digit: 9 }, { row: 8, col: 3, digit: 3 }, { row: 8, col: 4, digit: 6 },
    { row: 8, col: 5, digit: 8 }, { row: 8, col: 7, digit: 1 }, { row: 8, col: 8, digit: 6 },
    { row: 9, col: 1, digit: 9 }, { row: 9, col: 2, digit: 7 }, { row: 9, col: 4, digit: 9 },
    { row: 9, col: 5, digit: 7 }, { row: 9, col: 7, digit: 6 }, { row: 9, col: 8, digit: 8 },
  ],
} satisfies Content;

export const generated = { generator: "kakuro", version: 1, seed: "cold-tally" } satisfies Provenance;
