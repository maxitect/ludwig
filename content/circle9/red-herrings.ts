import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "red-herrings",
  title: "Red Herrings",
  difficulty: 2,
  publishedAt: new Date("2026-10-14T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    ".....94.1", "828.6.1..", ".2...5...", ".7..8.275", "....6...3", "..4.29...", ".523.6...", "9.6..1.7.", "8.....1..",
  ],
} satisfies Content;

export const generated = { generator: "circle9", version: 1, seed: "red-herrings" } satisfies Provenance;
