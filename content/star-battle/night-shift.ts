import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "night-shift",
  title: "Night Shift",
  difficulty: 4,
  publishedAt: new Date("2026-10-15T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 9,
  stars: 2,
  grid: [
    "111111113",
    "551111133",
    "550000333",
    "555000377",
    "555222777",
    "444222777",
    "444226668",
    "444426668",
    "444666688",
  ],
} satisfies Content;
