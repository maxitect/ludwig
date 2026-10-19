import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "quiet-hours",
  title: "Quiet Hours",
  difficulty: 2,
  publishedAt: new Date("2026-10-13T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 8,
  stars: 1,
  grid: [
    "44000133",
    "44400003",
    "44555003",
    "45555500",
    "55555220",
    "77722222",
    "77222222",
    "66222222",
  ],
} satisfies Content;
