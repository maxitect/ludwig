import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-ladder/schema";

export const meta = {
  slug: "shoe-size",
  title: "Shoe Size",
  difficulty: 1,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  startWord: "hand",
  endWord: "foot",
  rungs: ["band", "bond", "fond", "food"],
} satisfies Content;
