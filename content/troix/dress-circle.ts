import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/troix/schema";

export const meta = {
  slug: "dress-circle",
  title: "Dress Circle",
  difficulty: 1,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 3, symbol: "i" }, { row: 0, col: 4, symbol: "x" }, { row: 1, col: 1, symbol: "o" },
    { row: 1, col: 2, symbol: "o" }, { row: 2, col: 0, symbol: "i" }, { row: 2, col: 3, symbol: "o" },
    { row: 2, col: 5, symbol: "o" }, { row: 3, col: 2, symbol: "x" }, { row: 4, col: 0, symbol: "i" },
    { row: 4, col: 1, symbol: "i" }, { row: 4, col: 5, symbol: "o" }, { row: 5, col: 3, symbol: "i" },
    { row: 5, col: 5, symbol: "i" },
  ],
} satisfies Content;

export const generated = { generator: "troix", version: 1, seed: "dress-circle" } satisfies Provenance;
