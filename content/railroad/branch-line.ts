import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "branch-line",
  title: "Branch Line",
  difficulty: 1,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 5,
  cols: 5,
  entry: { row: 4, col: 4, side: "s" },
  exit: { row: 2, col: 0, side: "w" },
  rowCounts: [
    0, 0, 1, 4, 4,
  ],
  colCounts: [
    3, 2, 1, 2, 1,
  ],
  given: [],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "branch-line" } satisfies Provenance;
