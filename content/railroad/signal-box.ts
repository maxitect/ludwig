import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "signal-box",
  title: "Signal Box",
  difficulty: 3,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 8,
  entry: { row: 3, col: 0, side: "w" },
  exit: { row: 6, col: 1, side: "s" },
  rowCounts: [6, 7, 7, 8, 6, 1, 2],
  colCounts: [7, 6, 5, 5, 2, 5, 4, 3],
  given: [
    { row: 1, col: 2, piece: "sw" },
    { row: 2, col: 1, piece: "ns" },
  ],
} satisfies Content;
