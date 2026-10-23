import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/railroad/schema";

export const meta = {
  slug: "buffer-stop",
  title: "Buffer Stop",
  difficulty: 5,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 8,
  entry: { row: 0, col: 1, side: "n" },
  exit: { row: 7, col: 5, side: "s" },
  rowCounts: [
    3, 5, 5, 6, 4, 3, 2, 2,
  ],
  colCounts: [
    0, 3, 3, 5, 7, 5, 3, 4,
  ],
  given: [
    { row: 2, col: 2, piece: "sw" }, { row: 4, col: 4, piece: "nw" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "buffer-stop" } satisfies Provenance;
