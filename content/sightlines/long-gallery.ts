import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sightlines/schema";

export const meta = {
  slug: "long-gallery",
  title: "Long Gallery",
  difficulty: 5,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "...........",
    ".##...#.##.",
    ".#.....#...",
    "...#.......",
    ".....##..#.",
    "..#........",
    ".....#..#..",
    ".##....#...",
    "....#......",
    ".#.....##..",
    "...........",
  ],
  targetRow: 5,
  targetCol: 1,
  observers: [
    { row: 0, col: 0, facing: "se", fovDeg: 45 },
    { row: 0, col: 10, facing: "s", fovDeg: 90 },
    { row: 10, col: 0, facing: "e", fovDeg: 60 },
    { row: 10, col: 10, facing: "n", fovDeg: 90 },
    { row: 5, col: 8, facing: "w", fovDeg: 45 },
  ],
} satisfies Content;
