import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "points-failure",
  title: "Points Failure",
  difficulty: 1,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 5,
  cols: 5,
  entry: { row: 1, col: 0, side: "w" },
  exit: { row: 4, col: 3, side: "s" },
  rowCounts: [
    2, 2, 2, 5, 4,
  ],
  colCounts: [
    5, 5, 1, 2, 2,
  ],
  given: [],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "points-failure" } satisfies Provenance;
