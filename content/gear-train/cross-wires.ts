import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gear-train/schema";

export const meta = {
  slug: "cross-wires",
  title: "Cross Wires",
  difficulty: 3,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 9,
  cols: 12,
  targetClockwise: true,
  driver: { row: 2, col: 2, teeth: 16 },
  target: { row: 5, col: 10, teeth: 8 },
  bolts: [
    { row: 2, col: 5 },
    { row: 5, col: 2 },
  ],
  inventory: [
    { teeth: 8, count: 3 },
    { teeth: 16, count: 2 },
    { teeth: 24, count: 2 },
  ],
  solution: [
    { row: 5, col: 6, teeth: 24 },
  ],
} satisfies Content;
