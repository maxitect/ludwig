import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-ladder/schema";

export const meta = {
  slug: "coin-toss",
  title: "Coin Toss",
  difficulty: 1,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  startWord: "head",
  endWord: "tail",
  rungs: ["held", "hell", "tell", "tall"],
} satisfies Content;
