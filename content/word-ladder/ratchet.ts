import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-ladder/schema";

export const meta = {
  slug: "ratchet",
  title: "Ratchet",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  startWord: "gear",
  endWord: "turn",
  rungs: ["tear", "team", "term", "tern"],
} satisfies Content;
