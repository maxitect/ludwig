import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "last-column",
  title: "Last Column",
  difficulty: 5,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  cells: [
    { row: 1, col: 1, digit: 5 }, { row: 1, col: 2, digit: 2 }, { row: 1, col: 4, digit: 1 },
    { row: 1, col: 5, digit: 5 }, { row: 1, col: 6, digit: 3 }, { row: 1, col: 8, digit: 1 },
    { row: 1, col: 9, digit: 3 }, { row: 2, col: 1, digit: 9 }, { row: 2, col: 2, digit: 3 },
    { row: 2, col: 3, digit: 6 }, { row: 2, col: 4, digit: 4 }, { row: 2, col: 5, digit: 7 },
    { row: 2, col: 6, digit: 5 }, { row: 2, col: 8, digit: 2 }, { row: 2, col: 9, digit: 5 },
    { row: 3, col: 1, digit: 7 }, { row: 3, col: 2, digit: 1 }, { row: 3, col: 3, digit: 5 },
    { row: 3, col: 5, digit: 9 }, { row: 3, col: 6, digit: 8 }, { row: 3, col: 7, digit: 2 },
    { row: 3, col: 8, digit: 7 }, { row: 4, col: 1, digit: 8 }, { row: 4, col: 2, digit: 7 },
    { row: 4, col: 4, digit: 9 }, { row: 4, col: 5, digit: 8 }, { row: 4, col: 7, digit: 6 },
    { row: 4, col: 8, digit: 9 }, { row: 4, col: 9, digit: 8 }, { row: 5, col: 2, digit: 4 },
    { row: 5, col: 3, digit: 2 }, { row: 5, col: 4, digit: 1 }, { row: 5, col: 6, digit: 6 },
    { row: 5, col: 7, digit: 9 }, { row: 5, col: 8, digit: 8 }, { row: 5, col: 9, digit: 4 },
    { row: 6, col: 3, digit: 9 }, { row: 6, col: 4, digit: 8 }, { row: 6, col: 6, digit: 1 },
    { row: 6, col: 7, digit: 7 }, { row: 7, col: 2, digit: 3 }, { row: 7, col: 3, digit: 1 },
    { row: 7, col: 4, digit: 5 }, { row: 7, col: 5, digit: 4 }, { row: 7, col: 8, digit: 9 },
    { row: 7, col: 9, digit: 7 }, { row: 8, col: 1, digit: 8 }, { row: 8, col: 2, digit: 2 },
    { row: 8, col: 4, digit: 2 }, { row: 8, col: 5, digit: 9 }, { row: 8, col: 6, digit: 4 },
    { row: 8, col: 7, digit: 7 }, { row: 8, col: 8, digit: 8 }, { row: 8, col: 9, digit: 6 },
    { row: 9, col: 1, digit: 3 }, { row: 9, col: 2, digit: 1 }, { row: 9, col: 5, digit: 1 },
    { row: 9, col: 6, digit: 3 }, { row: 9, col: 7, digit: 9 }, { row: 9, col: 8, digit: 5 },
    { row: 9, col: 9, digit: 2 },
  ],
} satisfies Content;

export const generated = { generator: "kakuro", version: 1, seed: "last-column" } satisfies Provenance;
