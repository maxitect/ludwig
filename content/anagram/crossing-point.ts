import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/anagram/schema";

export const meta = {
  slug: "crossing-point",
  title: "Crossing Point",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  answer: "bridge",
  definitionHint: "Spans a river, or a card game for four.",
  scrambleSeed: 1901,
} satisfies Content;
