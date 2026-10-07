import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/book-cipher/schema";

export const meta = {
  slug: "fieldwork",
  title: "Fieldwork",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  textSlug: "natural-history-of-selborne",
  refs: [
    { page: 3, line: 7, wordIndex: 6 },
    { page: 1, line: 18, wordIndex: 2 },
    { page: 1, line: 2, wordIndex: 6 },
    { page: 2, line: 15, wordIndex: 5 },
    { page: 1, line: 8, wordIndex: 7 },
    { page: 1, line: 16, wordIndex: 3 },
  ],
} satisfies Content;
