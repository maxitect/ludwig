import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sightlines/schema";

export const meta = {
  slug: "reading-room",
  title: "Reading Room",
  difficulty: 1,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "......",
    "......",
    "..##..",
    "......",
    "......",
  ],
  targetRow: 3,
  targetCol: 0,
  observers: [
    { row: 0, col: 0, facing: "se", fovDeg: 60 },
    { row: 4, col: 5, facing: "nw", fovDeg: 60 },
  ],
} satisfies Content;
