import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "last-stop",
  title: "Last Stop",
  difficulty: 2,
  publishedAt: new Date("2026-10-18T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  entry: { row: 4, col: 5, side: "e" },
  exit: { row: 0, col: 0, side: "w" },
  rowCounts: [
    1, 4, 3, 5, 4, 3,
  ],
  colCounts: [
    5, 4, 3, 3, 4, 1,
  ],
  given: [
    { row: 3, col: 4, piece: "ns" }, { row: 5, col: 0, piece: "ne" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "last-stop" } satisfies Provenance;
