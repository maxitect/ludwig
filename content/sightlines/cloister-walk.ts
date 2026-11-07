import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sightlines/schema";

export const meta = {
  slug: "cloister-walk",
  title: "Cloister Walk",
  difficulty: 2,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Three people say they walked the cloister that night. Mark every square none of them could see.",
  grid: [
    ".......",
    ".#...#.",
    ".......",
    "...#...",
    ".......",
    ".#...#.",
    ".......",
  ],
  targetRow: 3,
  targetCol: 1,
  observers: [
    { row: 0, col: 3, facing: "s", fovDeg: 60, name: "The gardener" },
    { row: 6, col: 6, facing: "n", fovDeg: 60, name: "The bursar" },
    { row: 3, col: 6, facing: "w", fovDeg: 60, name: "The chaplain" },
  ],
} satisfies Content;
