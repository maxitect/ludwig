import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "night-ledger",
  title: "Night Ledger",
  difficulty: 2,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  cells: [
    { row: 1, col: 3, digit: 7 }, { row: 1, col: 4, digit: 1 }, { row: 1, col: 5, digit: 2 },
    { row: 1, col: 6, digit: 3 }, { row: 2, col: 2, digit: 9 }, { row: 2, col: 3, digit: 4 },
    { row: 2, col: 4, digit: 5 }, { row: 2, col: 5, digit: 1 }, { row: 2, col: 6, digit: 2 },
    { row: 3, col: 1, digit: 9 }, { row: 3, col: 2, digit: 7 }, { row: 3, col: 3, digit: 5 },
    { row: 4, col: 1, digit: 3 }, { row: 4, col: 2, digit: 1 }, { row: 4, col: 5, digit: 6 },
    { row: 4, col: 6, digit: 4 }, { row: 5, col: 2, digit: 5 }, { row: 5, col: 3, digit: 1 },
    { row: 5, col: 4, digit: 4 }, { row: 5, col: 5, digit: 2 }, { row: 5, col: 6, digit: 3 },
    { row: 6, col: 3, digit: 5 }, { row: 6, col: 4, digit: 9 },
  ],
} satisfies Content;

export const generated = { generator: "kakuro", version: 1, seed: "night-ledger" } satisfies Provenance;
