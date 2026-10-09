import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sightlines/schema";

export const meta = {
  slug: "porters-lodge",
  title: "Porter's Lodge",
  difficulty: 3,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "........",
    ".##..#..",
    "........",
    "....#...",
    ".#......",
    "......#.",
    "..#.....",
    "........",
  ],
  targetRow: 6,
  targetCol: 0,
  observers: [
    { row: 0, col: 7, facing: "sw", fovDeg: 120 },
    { row: 3, col: 0, facing: "e", fovDeg: 90 },
    { row: 7, col: 5, facing: "nw", fovDeg: 60 },
  ],
} satisfies Content;
