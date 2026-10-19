import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "fine-print",
  title: "Fine Print",
  difficulty: 2,
  publishedAt: new Date("2026-10-15T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  grid: [
    "00011234",
    "55000234",
    "56022224",
    "56224444",
    "76222484",
    "7229998a",
    "72b9888a",
    "22bbccaa",
  ],
} satisfies Content;
