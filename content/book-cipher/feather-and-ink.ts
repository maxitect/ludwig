import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/book-cipher/schema";

export const meta = {
  slug: "feather-and-ink",
  title: "Feather and Ink",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  textSlug: "natural-history-of-selborne",
  refs: [
    { page: 1, line: 8, wordIndex: 10 },
    { page: 5, line: 19, wordIndex: 1 },
    { page: 3, line: 9, wordIndex: 3 },
    { page: 1, line: 12, wordIndex: 7 },
    { page: 5, line: 19, wordIndex: 5 },
    { page: 5, line: 19, wordIndex: 6 },
  ],
} satisfies Content;
