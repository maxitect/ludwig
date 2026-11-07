import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "terminus",
  title: "Terminus",
  difficulty: 3,
  publishedAt: new Date("2026-10-20T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  entry: { row: 4, col: 5, side: "e" },
  exit: { row: 0, col: 4, side: "n" },
  rowCounts: [
    4, 1, 4, 5, 4, 0,
  ],
  colCounts: [
    0, 5, 4, 4, 3, 2,
  ],
  given: [
    { row: 3, col: 1, piece: "se" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "terminus" } satisfies Provenance;
