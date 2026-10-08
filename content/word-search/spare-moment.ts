import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-search/schema";

export const meta = {
  slug: "spare-moment",
  title: "Spare Moment",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "EWTLADDERJ",
    "LIDLMEMPWR",
    "YNRUASRQCE",
    "ZIOARSEVLH",
    "FUWAGMKIUP",
    "EKSFAPQOEI",
    "ZOSMNJKRUC",
    "ADOAAUKKKI",
    "MURIDDLECW",
    "FSCGKDSRAN",
  ],
  words: ["ANAGRAM", "CIPHER", "CLUE", "CROSSWORD", "LADDER", "MAZE", "RIDDLE", "SUDOKU"],
} satisfies Content;
