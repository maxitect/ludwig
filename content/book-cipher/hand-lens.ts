import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/book-cipher/schema";

export const meta = {
  slug: "hand-lens",
  title: "Hand Lens",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  textSlug: "natural-history-of-selborne",
  refs: [
    { page: 1, line: 6, wordIndex: 4 },
    { page: 4, line: 4, wordIndex: 7 },
    { page: 1, line: 9, wordIndex: 10 },
    { page: 2, line: 4, wordIndex: 5 },
    { page: 1, line: 10, wordIndex: 1 },
    { page: 9, line: 13, wordIndex: 9 },
  ],
} satisfies Content;
