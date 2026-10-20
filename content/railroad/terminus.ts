import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "terminus",
  title: "Terminus",
  difficulty: 3,
  publishedAt: new Date("2026-10-20T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  entry: { row: 0, col: 4, side: "n" },
  exit: { row: 7, col: 6, side: "s" },
  rowCounts: [4, 3, 8, 4, 7, 4, 4, 2],
  colCounts: [3, 4, 4, 5, 5, 4, 5, 6],
  given: [
    { row: 0, col: 4, piece: "ns" },
    { row: 5, col: 6, piece: "se" },
  ],
} satisfies Content;
