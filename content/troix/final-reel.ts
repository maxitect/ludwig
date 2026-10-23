import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/troix/schema";

export const meta = {
  slug: "final-reel",
  title: "Final Reel",
  difficulty: 5,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 9,
  givens: [
    { row: 0, col: 2, symbol: "x" }, { row: 0, col: 6, symbol: "i" }, { row: 0, col: 7, symbol: "i" },
    { row: 1, col: 2, symbol: "o" }, { row: 1, col: 3, symbol: "o" }, { row: 1, col: 4, symbol: "i" },
    { row: 1, col: 5, symbol: "x" }, { row: 1, col: 6, symbol: "o" }, { row: 2, col: 0, symbol: "x" },
    { row: 2, col: 3, symbol: "i" }, { row: 3, col: 7, symbol: "x" }, { row: 3, col: 8, symbol: "x" },
    { row: 4, col: 5, symbol: "i" }, { row: 4, col: 6, symbol: "i" }, { row: 4, col: 7, symbol: "x" },
    { row: 5, col: 1, symbol: "x" }, { row: 5, col: 5, symbol: "o" }, { row: 5, col: 8, symbol: "o" },
    { row: 6, col: 0, symbol: "x" }, { row: 6, col: 2, symbol: "x" }, { row: 6, col: 3, symbol: "x" },
    { row: 6, col: 5, symbol: "o" }, { row: 7, col: 2, symbol: "o" }, { row: 7, col: 6, symbol: "i" },
    { row: 7, col: 8, symbol: "o" }, { row: 8, col: 1, symbol: "x" }, { row: 8, col: 3, symbol: "x" },
    { row: 8, col: 5, symbol: "o" }, { row: 8, col: 8, symbol: "o" },
  ],
} satisfies Content;

export const generated = { generator: "troix", version: 1, seed: "final-reel" } satisfies Provenance;
