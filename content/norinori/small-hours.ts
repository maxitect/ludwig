import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "small-hours",
  title: "Small Hours",
  difficulty: 1,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  grid: [
    "155555", "170055", "773354", "773344", "776644", "766622",
  ],
} satisfies Content;

export const generated = { generator: "norinori", version: 1, seed: "small-hours" } satisfies Provenance;
