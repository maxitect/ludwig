import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/nonogram/schema";

export const meta = {
  slug: "ink-well",
  title: "Ink Well",
  difficulty: 1,
  publishedAt: new Date("2026-10-15T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 11,
  cols: 15,
  caption: "A pencil, sharpened for the crossword",
  grid: [
    "...............",
    "...............",
    "...............",
    "......#####.##.",
    "....#####..####",
    "..#########.###",
    "....#####..####",
    "......#####.##.",
    "...............",
    ".#############.",
    "...............",
  ],
} satisfies Content;
