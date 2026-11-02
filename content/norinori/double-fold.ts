import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "double-fold",
  title: "Double Fold",
  difficulty: 2,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  grid: [
    "225066", "235056", "135556", "133356", "733456", "774446",
  ],
} satisfies Content;

export const generated = { generator: "norinori", version: 1, seed: "double-fold" } satisfies Provenance;
