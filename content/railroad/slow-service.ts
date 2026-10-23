import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "slow-service",
  title: "Slow Service",
  difficulty: 4,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 9,
  cols: 9,
  entry: { row: 8, col: 8, side: "e" },
  exit: { row: 5, col: 0, side: "w" },
  rowCounts: [
    0, 0, 2, 3, 5, 6, 3, 6, 9,
  ],
  colCounts: [
    3, 4, 4, 7, 6, 3, 3, 2, 2,
  ],
  given: [
    { row: 2, col: 3, piece: "sw" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "slow-service" } satisfies Provenance;
