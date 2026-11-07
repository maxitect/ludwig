import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "borrowed-time",
  title: "Borrowed Time",
  difficulty: 3,
  publishedAt: new Date("2026-10-18T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  givens: [
    { row: 0, col: 0, digit: 6 }, { row: 1, col: 1, digit: 6 }, { row: 1, col: 3, digit: 6 },
    { row: 1, col: 6, digit: 8 }, { row: 1, col: 7, digit: 5 }, { row: 1, col: 8, digit: 5 },
    { row: 2, col: 3, digit: 3 }, { row: 2, col: 5, digit: 8 }, { row: 2, col: 8, digit: 4 },
    { row: 3, col: 3, digit: 9 }, { row: 3, col: 5, digit: 8 }, { row: 3, col: 6, digit: 6 },
    { row: 3, col: 9, digit: 4 }, { row: 4, col: 1, digit: 2 }, { row: 4, col: 2, digit: 2 },
    { row: 4, col: 7, digit: 1 }, { row: 4, col: 8, digit: 9 }, { row: 5, col: 4, digit: 4 },
    { row: 5, col: 5, digit: 3 }, { row: 6, col: 0, digit: 2 }, { row: 6, col: 2, digit: 5 },
    { row: 6, col: 3, digit: 3 }, { row: 7, col: 2, digit: 4 }, { row: 7, col: 4, digit: 3 },
    { row: 7, col: 6, digit: 9 }, { row: 7, col: 7, digit: 6 }, { row: 8, col: 0, digit: 5 },
    { row: 8, col: 3, digit: 6 }, { row: 8, col: 5, digit: 4 }, { row: 8, col: 6, digit: 3 },
    { row: 9, col: 0, digit: 5 }, { row: 9, col: 3, digit: 5 }, { row: 9, col: 6, digit: 2 },
  ],
} satisfies Content;

export const generated = { generator: "fillomino", version: 1, seed: "borrowed-time" } satisfies Provenance;
