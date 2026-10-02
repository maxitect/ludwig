import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/anagram/schema";

export const meta = {
  slug: "title-sequence",
  title: "Title Sequence",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  answer: "ink and paper",
  definitionHint: "What the opening titles are made from.",
  scrambleSeed: 1904,
} satisfies Content;
