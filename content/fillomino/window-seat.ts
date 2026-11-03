import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "window-seat",
  title: "Window Seat",
  difficulty: 2,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  givens: [
    { row: 0, col: 0, digit: 2 }, { row: 0, col: 3, digit: 8 }, { row: 0, col: 5, digit: 8 },
    { row: 0, col: 6, digit: 7 }, { row: 0, col: 7, digit: 7 }, { row: 1, col: 0, digit: 1 },
    { row: 1, col: 1, digit: 6 }, { row: 1, col: 3, digit: 8 }, { row: 1, col: 4, digit: 8 },
    { row: 1, col: 7, digit: 7 }, { row: 2, col: 1, digit: 6 }, { row: 2, col: 2, digit: 8 },
    { row: 2, col: 3, digit: 7 }, { row: 2, col: 4, digit: 7 }, { row: 2, col: 6, digit: 7 },
    { row: 2, col: 7, digit: 7 }, { row: 3, col: 0, digit: 6 }, { row: 3, col: 2, digit: 4 },
    { row: 3, col: 3, digit: 7 }, { row: 3, col: 5, digit: 2 }, { row: 3, col: 6, digit: 4 },
    { row: 3, col: 7, digit: 4 }, { row: 4, col: 0, digit: 2 }, { row: 4, col: 3, digit: 7 },
    { row: 4, col: 5, digit: 7 }, { row: 4, col: 7, digit: 4 }, { row: 5, col: 3, digit: 6 },
    { row: 5, col: 4, digit: 5 }, { row: 5, col: 7, digit: 5 }, { row: 6, col: 4, digit: 4 },
    { row: 6, col: 6, digit: 1 }, { row: 7, col: 1, digit: 2 }, { row: 7, col: 2, digit: 6 },
    { row: 7, col: 3, digit: 4 }, { row: 7, col: 5, digit: 4 }, { row: 7, col: 7, digit: 3 },
  ],
} satisfies Content;

export const generated = { generator: "fillomino", version: 1, seed: "window-seat" } satisfies Provenance;
