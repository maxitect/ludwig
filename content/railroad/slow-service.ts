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
  rows: 8,
  cols: 8,
  entry: { row: 7, col: 7, side: "s" },
  exit: { row: 5, col: 0, side: "w" },
  rowCounts: [
    5, 7, 3, 3, 5, 6, 6, 3,
  ],
  colCounts: [
    3, 7, 5, 5, 4, 5, 2, 7,
  ],
  given: [
    { row: 1, col: 1, piece: "ne" }, { row: 1, col: 6, piece: "ne" }, { row: 2, col: 1, piece: "se" },
    { row: 5, col: 0, piece: "ew" }, { row: 5, col: 4, piece: "ew" }, { row: 6, col: 3, piece: "ew" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "slow-service" } satisfies Provenance;
