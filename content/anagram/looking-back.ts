import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/anagram/schema";

export const meta = {
  slug: "looking-back",
  title: "Looking Back",
  difficulty: 4,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  answer: "retrograde analysis",
  definitionHint: "Solving a position by working from the end to the start.",
  scrambleSeed: 1905,
} satisfies Content;
