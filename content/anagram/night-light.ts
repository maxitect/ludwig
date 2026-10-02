import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/anagram/schema";

export const meta = {
  slug: "night-light",
  title: "Night Light",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  answer: "lantern",
  definitionHint: "A portable lamp with a case around the flame.",
  scrambleSeed: 1902,
} satisfies Content;
