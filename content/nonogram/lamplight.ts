import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/nonogram/schema";

export const meta = {
  slug: "lamplight",
  title: "Lamplight",
  difficulty: 3,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 15,
  cols: 15,
  caption: "The walker, on his way to the next case",
  grid: [
    "......###......",
    "....#######....",
    "......###......",
    "......###......",
    ".....#####.....",
    "....#######....",
    "...####.####...",
    "..#####.#####..",
    "..####..#####..",
    "..####...####..",
    "..###....#####.",
    "..###.....####.",
    ".###......###..",
    ".##.......###..",
    "###.......####.",
  ],
} satisfies Content;
