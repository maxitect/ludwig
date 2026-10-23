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
  rows: 10,
  cols: 10,
  entry: { row: 3, col: 0, side: "w" },
  exit: { row: 0, col: 9, side: "n" },
  rowCounts: [
    3, 5, 4, 6, 6, 6, 9, 4, 0, 0,
  ],
  colCounts: [
    5, 6, 6, 6, 5, 2, 2, 2, 4, 5,
  ],
  given: [
    { row: 1, col: 2, piece: "ne" }, { row: 2, col: 3, piece: "ne" }, { row: 2, col: 9, piece: "ns" },
    { row: 3, col: 0, piece: "nw" }, { row: 4, col: 1, piece: "ns" }, { row: 5, col: 3, piece: "sw" },
    { row: 6, col: 2, piece: "ew" },
  ],
} satisfies Content;

export const generated = { generator: "railroad", version: 1, seed: "buffer-stop" } satisfies Provenance;
