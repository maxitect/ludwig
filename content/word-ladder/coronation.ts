import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-ladder/schema";

export const meta = {
  slug: "coronation",
  title: "Coronation",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  startWord: "pawn",
  endWord: "king",
  rungs: ["paws", "pans", "pins", "ping"],
} satisfies Content;
