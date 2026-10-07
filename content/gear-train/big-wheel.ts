import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gear-train/schema";

export const meta = {
  slug: "big-wheel",
  title: "Big Wheel",
  difficulty: 2,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 9,
  targetClockwise: true,
  driver: { row: 2, col: 1, teeth: 8 },
  target: { row: 2, col: 7, teeth: 8 },
  bolts: [],
  inventory: [
    { teeth: 8, count: 3 },
    { teeth: 16, count: 2 },
    { teeth: 24, count: 1 },
  ],
  solution: [
    { row: 2, col: 4, teeth: 16 },
  ],
} satisfies Content;
