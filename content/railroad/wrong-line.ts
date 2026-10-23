import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "wrong-line",
  title: "Wrong Line",
  difficulty: 3,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  entry: { row: 3, col: 0, side: "w" },
  exit: { row: 6, col: 6, side: "s" },
  rowCounts: [
    2, 2, 3, 4, 7, 5, 5,
  ],
  colCounts: [
    2, 1, 3, 3, 7, 7, 5,
  ],
  given: [
    { row: 4, col: 2, piece: "ew" }, { row: 4, col: 4, piece: "ew" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "wrong-line" } satisfies Provenance;
