import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/troix/schema";

export const meta = {
  slug: "cross-and-circle",
  title: "Cross and Circle",
  difficulty: 2,
  publishedAt: new Date("2026-10-15T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 0, symbol: "o" },
    { row: 0, col: 1, symbol: "i" },
    { row: 1, col: 0, symbol: "o" },
    { row: 1, col: 2, symbol: "o" },
    { row: 2, col: 0, symbol: "x" },
    { row: 2, col: 1, symbol: "x" },
    { row: 2, col: 4, symbol: "i" },
    { row: 3, col: 2, symbol: "i" },
    { row: 3, col: 3, symbol: "i" },
    { row: 3, col: 5, symbol: "o" },
    { row: 4, col: 3, symbol: "i" },
    { row: 5, col: 1, symbol: "i" },
    { row: 5, col: 2, symbol: "o" },
    { row: 5, col: 4, symbol: "x" },
  ],
} satisfies Content;
