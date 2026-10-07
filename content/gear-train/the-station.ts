import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gear-train/schema";

export const meta = {
  slug: "the-station",
  title: "The Station",
  difficulty: 4,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 11,
  cols: 12,
  targetClockwise: true,
  driver: { row: 2, col: 1, teeth: 8 },
  target: { row: 9, col: 10, teeth: 8 },
  bolts: [
    { row: 2, col: 7 },
    { row: 6, col: 4 },
  ],
  inventory: [
    { teeth: 8, count: 4 },
    { teeth: 16, count: 2 },
    { teeth: 24, count: 2 },
  ],
  solution: [
    { row: 2, col: 4, teeth: 16 },
    { row: 5, col: 8, teeth: 24 },
    { row: 9, col: 8, teeth: 8 },
  ],
} satisfies Content;
