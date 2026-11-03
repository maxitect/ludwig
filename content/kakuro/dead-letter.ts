import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "dead-letter",
  title: "Dead Letter",
  difficulty: 1,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  cells: [
    { row: 1, col: 1, digit: 1 }, { row: 1, col: 2, digit: 3 }, { row: 1, col: 5, digit: 2 },
    { row: 1, col: 6, digit: 6 }, { row: 2, col: 1, digit: 9 }, { row: 2, col: 2, digit: 8 },
    { row: 2, col: 3, digit: 1 }, { row: 2, col: 5, digit: 1 }, { row: 2, col: 6, digit: 3 },
    { row: 3, col: 3, digit: 8 }, { row: 3, col: 4, digit: 6 }, { row: 3, col: 5, digit: 4 },
    { row: 4, col: 1, digit: 3 }, { row: 4, col: 2, digit: 1 }, { row: 4, col: 3, digit: 5 },
    { row: 4, col: 4, digit: 2 }, { row: 5, col: 1, digit: 8 }, { row: 5, col: 2, digit: 2 },
    { row: 5, col: 4, digit: 3 }, { row: 5, col: 5, digit: 2 }, { row: 5, col: 6, digit: 1 },
    { row: 6, col: 1, digit: 9 }, { row: 6, col: 2, digit: 3 }, { row: 6, col: 4, digit: 9 },
    { row: 6, col: 5, digit: 8 }, { row: 6, col: 6, digit: 6 },
  ],
} satisfies Content;

export const generated = { generator: "kakuro", version: 1, seed: "dead-letter" } satisfies Provenance;
