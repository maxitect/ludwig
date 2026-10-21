import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "branch-line",
  title: "Branch Line",
  difficulty: 1,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  entry: { row: 0, col: 2, side: "n" },
  exit: { row: 3, col: 5, side: "e" },
  rowCounts: [4, 5, 6, 6, 2, 2],
  colCounts: [4, 5, 4, 4, 4, 4],
  given: [
    { row: 3, col: 2, piece: "nw" },
    { row: 3, col: 4, piece: "ew" },
  ],
} satisfies Content;
