import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/book-cipher/schema";

export const meta = {
  slug: "pennants-post",
  title: "Pennant's Post",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  textSlug: "natural-history-of-selborne",
  refs: [
    { page: 9, line: 11, wordIndex: 1 },
    { page: 3, line: 1, wordIndex: 8 },
    { page: 5, line: 18, wordIndex: 4 },
    { page: 2, line: 3, wordIndex: 3 },
    { page: 1, line: 2, wordIndex: 8 },
    { page: 2, line: 3, wordIndex: 5 },
  ],
} satisfies Content;
