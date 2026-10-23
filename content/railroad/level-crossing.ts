import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "level-crossing",
  title: "Level Crossing",
  difficulty: 2,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 5,
  cols: 5,
  entry: { row: 3, col: 0, side: "w" },
  exit: { row: 3, col: 4, side: "e" },
  rowCounts: [
    3, 2, 3, 3, 4,
  ],
  colCounts: [
    2, 1, 4, 4, 4,
  ],
  given: [
    { row: 2, col: 4, piece: "ns" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "level-crossing" } satisfies Provenance;
