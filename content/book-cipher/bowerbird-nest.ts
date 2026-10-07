import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/book-cipher/schema";

export const meta = {
  slug: "bowerbird-nest",
  title: "Bowerbird's Nest",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  textSlug: "natural-history-of-selborne",
  refs: [
    { page: 6, line: 18, wordIndex: 7 },
    { page: 6, line: 18, wordIndex: 8 },
    { page: 1, line: 17, wordIndex: 5 },
    { page: 4, line: 14, wordIndex: 2 },
    { page: 4, line: 8, wordIndex: 2 },
    { page: 6, line: 19, wordIndex: 1 },
  ],
} satisfies Content;
