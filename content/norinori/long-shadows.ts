import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "long-shadows",
  title: "Long Shadows",
  difficulty: 3,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 9,
  cols: 9,
  grid: [
    "001111222",
    "031411556",
    "034411556",
    "055111155",
    "055555555",
    "077788599",
    "000088aa9",
    "00bbccacd",
    "eebbccccd",
  ],
} satisfies Content;
