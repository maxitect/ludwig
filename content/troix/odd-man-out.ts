import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/troix/schema";

export const meta = {
  slug: "odd-man-out",
  title: "Odd Man Out",
  difficulty: 2,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 9,
  givens: [
    { row: 0, col: 1, symbol: "o" },
    { row: 0, col: 6, symbol: "o" },
    { row: 1, col: 5, symbol: "x" },
    { row: 2, col: 1, symbol: "x" },
    { row: 2, col: 2, symbol: "x" },
    { row: 2, col: 7, symbol: "i" },
    { row: 3, col: 3, symbol: "o" },
    { row: 3, col: 5, symbol: "o" },
    { row: 3, col: 6, symbol: "x" },
    { row: 3, col: 7, symbol: "o" },
    { row: 3, col: 8, symbol: "x" },
    { row: 4, col: 0, symbol: "x" },
    { row: 4, col: 4, symbol: "i" },
    { row: 4, col: 7, symbol: "x" },
    { row: 5, col: 0, symbol: "i" },
    { row: 5, col: 1, symbol: "i" },
    { row: 5, col: 3, symbol: "i" },
    { row: 5, col: 4, symbol: "o" },
    { row: 6, col: 0, symbol: "o" },
    { row: 6, col: 4, symbol: "x" },
    { row: 6, col: 6, symbol: "o" },
    { row: 6, col: 7, symbol: "o" },
    { row: 6, col: 8, symbol: "x" },
    { row: 7, col: 3, symbol: "i" },
    { row: 7, col: 6, symbol: "x" },
    { row: 7, col: 7, symbol: "x" },
    { row: 7, col: 8, symbol: "o" },
    { row: 8, col: 1, symbol: "i" },
    { row: 8, col: 4, symbol: "o" },
    { row: 8, col: 6, symbol: "o" },
    { row: 8, col: 8, symbol: "i" },
  ],
} satisfies Content;
