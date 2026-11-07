import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/fillomino/schema";

export const meta = {
  slug: "lamp-and-lens",
  title: "Lamp and Lens",
  difficulty: 2,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  givens: [
    { row: 0, col: 1, digit: 4 }, { row: 0, col: 2, digit: 6 }, { row: 0, col: 3, digit: 2 },
    { row: 0, col: 5, digit: 3 }, { row: 1, col: 0, digit: 4 }, { row: 1, col: 1, digit: 4 },
    { row: 1, col: 3, digit: 5 }, { row: 1, col: 7, digit: 6 }, { row: 2, col: 3, digit: 6 },
    { row: 2, col: 5, digit: 5 }, { row: 2, col: 6, digit: 6 }, { row: 2, col: 7, digit: 6 },
    { row: 3, col: 0, digit: 5 }, { row: 3, col: 2, digit: 2 }, { row: 3, col: 3, digit: 7 },
    { row: 3, col: 5, digit: 3 }, { row: 4, col: 6, digit: 1 }, { row: 5, col: 0, digit: 5 },
    { row: 5, col: 2, digit: 5 }, { row: 5, col: 3, digit: 3 }, { row: 5, col: 5, digit: 7 },
    { row: 5, col: 6, digit: 5 }, { row: 5, col: 7, digit: 6 }, { row: 6, col: 0, digit: 2 },
    { row: 6, col: 4, digit: 7 }, { row: 7, col: 0, digit: 3 }, { row: 7, col: 6, digit: 6 },
    { row: 7, col: 7, digit: 5 },
  ],
} satisfies Content;

export const generated = { generator: "fillomino", version: 1, seed: "lamp-and-lens" } satisfies Provenance;
