import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "paper-trail",
  title: "Paper Trail",
  difficulty: 3,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  grid: [
    "6665555", "7464511", "7444431", "7770033", "7999883", "7988888", "9988228",
  ],
} satisfies Content;

export const generated = { generator: "norinori", version: 1, seed: "paper-trail" } satisfies Provenance;
