import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "last-stop",
  title: "Last Stop",
  difficulty: 2,
  publishedAt: new Date("2026-10-18T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  entry: { row: 6, col: 5, side: "s" },
  exit: { row: 0, col: 6, side: "e" },
  rowCounts: [5, 5, 5, 4, 5, 3, 5],
  colCounts: [4, 5, 2, 6, 5, 7, 3],
  given: [
    { row: 2, col: 5, piece: "se" },
    { row: 6, col: 4, piece: "nw" },
  ],
} satisfies Content;
