import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sightlines/schema";

export const meta = {
  slug: "long-gallery",
  title: "Long Gallery",
  difficulty: 5,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Five guards watched the long gallery. Mark every square none of them could have seen.",
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
    { row: 0, col: 0, facing: "se", fovDeg: 45, name: "The curator" },
    { row: 0, col: 10, facing: "s", fovDeg: 90, name: "The steward" },
    { row: 10, col: 0, facing: "e", fovDeg: 60, name: "The cleaner" },
    { row: 10, col: 10, facing: "n", fovDeg: 90, name: "The doorman" },
    { row: 5, col: 8, facing: "w", fovDeg: 45, name: "The night guard" },
  ],
} satisfies Content;
