import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "first-light",
  title: "First Light",
  difficulty: 1,
  publishedAt: new Date("2026-10-12T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  stars: 1,
  grid: [
    "222220",
    "552220",
    "555210",
    "555000",
    "545330",
    "544330",
  ],
} satisfies Content;
