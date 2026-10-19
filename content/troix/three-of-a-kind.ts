import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/troix/schema";

export const meta = {
  slug: "three-of-a-kind",
  title: "Three of a Kind",
  difficulty: 1,
  publishedAt: new Date("2026-10-14T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 2, symbol: "o" },
    { row: 1, col: 0, symbol: "i" },
    { row: 1, col: 3, symbol: "x" },
    { row: 2, col: 3, symbol: "x" },
    { row: 3, col: 0, symbol: "o" },
    { row: 3, col: 1, symbol: "o" },
    { row: 3, col: 2, symbol: "i" },
    { row: 4, col: 1, symbol: "o" },
    { row: 4, col: 4, symbol: "x" },
    { row: 4, col: 5, symbol: "x" },
    { row: 5, col: 2, symbol: "i" },
    { row: 5, col: 4, symbol: "i" },
  ],
} satisfies Content;
