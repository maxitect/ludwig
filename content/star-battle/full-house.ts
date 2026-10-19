import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "full-house",
  title: "Full House",
  difficulty: 5,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 10,
  stars: 2,
  grid: [
    "4666663333",
    "4461163993",
    "4461163955",
    "4441189955",
    "4440089955",
    "0040885555",
    "0000885555",
    "0000227775",
    "0002222775",
    "2222227777",
  ],
} satisfies Content;
