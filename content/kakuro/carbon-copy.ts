import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/kakuro/schema";

export const meta = {
  slug: "carbon-copy",
  title: "Carbon Copy",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  cells: [
    { row: 1, col: 3, digit: 2 }, { row: 1, col: 4, digit: 1 },
    { row: 2, col: 3, digit: 4 }, { row: 2, col: 4, digit: 2 },
    { row: 3, col: 3, digit: 9 }, { row: 3, col: 4, digit: 3 },
    { row: 4, col: 1, digit: 3 }, { row: 4, col: 2, digit: 2 }, { row: 4, col: 3, digit: 1 }, { row: 4, col: 4, digit: 5 }, { row: 4, col: 5, digit: 7 },
    { row: 5, col: 1, digit: 5 }, { row: 5, col: 2, digit: 4 }, { row: 5, col: 3, digit: 8 }, { row: 5, col: 4, digit: 6 }, { row: 5, col: 5, digit: 9 },
  ],
} satisfies Content;
