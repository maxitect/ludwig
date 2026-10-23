import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "round-trip",
  title: "Round Trip",
  difficulty: 3,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    ".61.5.6..", "7..9...65", ".43.82.2.", "7...98.3.", ".598.....", ".4.75....", "....89.12", "41...454.", ".6.7..1.8",
  ],
} satisfies Content;

export const generated = { generator: "circle9", version: 1, seed: "round-trip" } satisfies Provenance;
