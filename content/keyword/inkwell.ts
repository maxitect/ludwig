import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/keyword/schema";

export const meta = {
  slug: "inkwell",
  title: "Inkwell",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "fold the paper twice and slide it under the door",
  keyword: "fathom",
} satisfies Content;
