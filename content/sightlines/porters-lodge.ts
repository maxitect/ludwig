import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sightlines/schema";

export const meta = {
  slug: "porters-lodge",
  title: "Porter's Lodge",
  difficulty: 3,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Three people swear they saw the alcove. Mark every square none of them could have seen.",
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
    { row: 0, col: 7, facing: "sw", fovDeg: 120, name: "The porter" },
    { row: 3, col: 0, facing: "e", fovDeg: 90, name: "The student" },
    { row: 7, col: 5, facing: "nw", fovDeg: 60, name: "The delivery driver" },
  ],
} satisfies Content;
