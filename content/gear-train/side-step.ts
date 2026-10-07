import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/gear-train/schema";

export const meta = {
  slug: "side-step",
  title: "Side Step",
  difficulty: 2,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 9,
  targetClockwise: true,
  driver: { row: 1, col: 1, teeth: 8 },
  target: { row: 3, col: 7, teeth: 8 },
  bolts: [
    { row: 1, col: 5 },
    { row: 3, col: 1 },
    { row: 5, col: 3 },
  ],
  inventory: [
    { teeth: 8, count: 5 },
  ],
  solution: [
    { row: 1, col: 3, teeth: 8 },
    { row: 3, col: 3, teeth: 8 },
    { row: 3, col: 5, teeth: 8 },
  ],
} satisfies Content;
