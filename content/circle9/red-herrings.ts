import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "red-herrings",
  title: "Red Herrings",
  difficulty: 2,
  publishedAt: new Date("2026-10-14T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    ".6..3.87.",
    "..62..4.8",
    "...5..8..",
    "7........",
    ".....1.1.",
    "8..4.214.",
    "1.8.33...",
    "..5.1.92.",
    "72...1..9",
  ],
} satisfies Content;
