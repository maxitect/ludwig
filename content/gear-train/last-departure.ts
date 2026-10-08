import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gear-train/schema";

export const meta = {
  slug: "last-departure",
  title: "Last Departure",
  difficulty: 5,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 12,
  cols: 12,
  targetClockwise: true,
  driver: { row: 3, col: 2, teeth: 8 },
  target: { row: 10, col: 7, teeth: 8 },
  bolts: [
    { row: 4, col: 9 },
    { row: 7, col: 6 },
  ],
  inventory: [
    { teeth: 8, count: 5 },
    { teeth: 16, count: 3 },
    { teeth: 24, count: 2 },
  ],
  solution: [
    { row: 3, col: 6, teeth: 24 },
    { row: 7, col: 9, teeth: 16 },
    { row: 10, col: 9, teeth: 8 },
  ],
} satisfies Content;
