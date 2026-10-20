import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/troix/schema";

export const meta = {
  slug: "the-third-symbol",
  title: "The Third Symbol",
  difficulty: 3,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 9,
  givens: [
    { row: 0, col: 3, symbol: "o" },
    { row: 0, col: 5, symbol: "i" },
    { row: 0, col: 6, symbol: "o" },
    { row: 1, col: 0, symbol: "i" },
    { row: 1, col: 6, symbol: "i" },
    { row: 1, col: 8, symbol: "x" },
    { row: 2, col: 0, symbol: "i" },
    { row: 2, col: 2, symbol: "o" },
    { row: 2, col: 8, symbol: "i" },
    { row: 3, col: 1, symbol: "i" },
    { row: 3, col: 4, symbol: "x" },
    { row: 3, col: 7, symbol: "i" },
    { row: 3, col: 8, symbol: "i" },
    { row: 4, col: 0, symbol: "x" },
    { row: 4, col: 4, symbol: "x" },
    { row: 5, col: 4, symbol: "o" },
    { row: 5, col: 5, symbol: "o" },
    { row: 6, col: 1, symbol: "x" },
    { row: 6, col: 4, symbol: "x" },
    { row: 6, col: 8, symbol: "x" },
    { row: 7, col: 5, symbol: "o" },
    { row: 7, col: 6, symbol: "i" },
    { row: 7, col: 7, symbol: "o" },
    { row: 8, col: 3, symbol: "o" },
    { row: 8, col: 5, symbol: "i" },
    { row: 8, col: 6, symbol: "o" },
    { row: 8, col: 7, symbol: "o" },
  ],
} satisfies Content;
