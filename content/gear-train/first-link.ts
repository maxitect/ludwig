import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gear-train/schema";

export const meta = {
  slug: "first-link",
  title: "First Link",
  difficulty: 1,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 5,
  cols: 7,
  targetClockwise: true,
  driver: { row: 2, col: 1, teeth: 8 },
  target: { row: 2, col: 5, teeth: 8 },
  bolts: [],
  inventory: [
    { teeth: 8, count: 3 },
  ],
  solution: [
    { row: 2, col: 3, teeth: 8 },
  ],
} satisfies Content;
