import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/keyword/schema";

export const meta = {
  slug: "blotting-paper",
  title: "Blotting Paper",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "she kept every secret folded inside her glove",
  keyword: "blotter",
} satisfies Content;
