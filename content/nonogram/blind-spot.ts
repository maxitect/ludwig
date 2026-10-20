import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/nonogram/schema";

export const meta = {
  slug: "blind-spot",
  title: "Blind Spot",
  difficulty: 2,
  publishedAt: new Date("2026-10-13T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 13,
  cols: 13,
  caption: "A gear of eight teeth, turning at last",
  grid: [
    ".....###.....",
    ".##..###..##.",
    ".###.###.###.",
    "..#########..",
    "..###...###..",
    "####.....####",
    "####.....####",
    "####.....####",
    "..###...###..",
    "..#########..",
    ".###.###.###.",
    ".##..###..##.",
    ".....###.....",
  ],
} satisfies Content;
