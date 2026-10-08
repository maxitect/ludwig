import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-ladder/schema";

export const meta = {
  slug: "long-day",
  title: "Long Day",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  startWord: "dawn",
  endWord: "dusk",
  rungs: ["darn", "dark", "dirk", "disk"],
} satisfies Content;
