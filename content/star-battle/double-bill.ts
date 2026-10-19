import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "double-bill",
  title: "Double Bill",
  difficulty: 3,
  publishedAt: new Date("2026-10-14T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 8,
  stars: 2,
  grid: [
    "11444222",
    "11644225",
    "61644255",
    "66644255",
    "66662255",
    "66663300",
    "77773000",
    "77773000",
  ],
} satisfies Content;
