import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/anagram/schema";

export const meta = {
  slug: "holy-ground",
  title: "Holy Ground",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  answer: "cathedral",
  definitionHint: "A great church, the seat of a bishop.",
  scrambleSeed: 1903,
} satisfies Content;
