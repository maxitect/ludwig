import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "night-train",
  title: "Night Train",
  difficulty: 1,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  entry: { row: 0, col: 2, side: "n" },
  exit: { row: 3, col: 0, side: "w" },
  rowCounts: [3, 3, 4, 6, 4, 4],
  colCounts: [1, 1, 6, 6, 6, 4],
  given: [
    { row: 2, col: 3, piece: "ns" },
    { row: 3, col: 3, piece: "ns" },
  ],
} satisfies Content;
