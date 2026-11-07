import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "signal-box",
  title: "Signal Box",
  difficulty: 3,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  entry: { row: 6, col: 6, side: "s" },
  exit: { row: 0, col: 3, side: "n" },
  rowCounts: [
    4, 3, 1, 1, 1, 2, 4,
  ],
  colCounts: [
    0, 0, 0, 3, 7, 3, 3,
  ],
  given: [],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "signal-box" } satisfies Provenance;
