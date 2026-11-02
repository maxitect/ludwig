import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "cold-case",
  title: "Cold Case",
  difficulty: 4,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  grid: [
    "3355ccca", "6655c00a", "d666c00a", "d777caaa", "dd77744a", "db88899a", "bbb88991", "22bb9991",
  ],
} satisfies Content;

export const generated = { generator: "norinori", version: 1, seed: "cold-case" } satisfies Provenance;
