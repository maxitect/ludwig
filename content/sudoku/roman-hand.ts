import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "roman-hand",
  title: "Roman Hand",
  difficulty: 2,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 1, col: 0, digit: 8 }, { row: 1, col: 2, digit: 9 }, { row: 3, col: 5, digit: 2 },
    { row: 4, col: 2, digit: 8 }, { row: 8, col: 0, digit: 3 },
  ],
  xv: {
    marks: [
      { row: 1, col: 3, direction: "right", mark: "x" }, { row: 1, col: 6, direction: "right", mark: "x" },
      { row: 1, col: 7, direction: "right", mark: "v" }, { row: 1, col: 8, direction: "down", mark: "x" },
      { row: 2, col: 0, direction: "right", mark: "v" }, { row: 2, col: 2, direction: "right", mark: "v" },
      { row: 3, col: 4, direction: "down", mark: "x" }, { row: 3, col: 5, direction: "down", mark: "v" },
      { row: 5, col: 6, direction: "right", mark: "v" }, { row: 5, col: 6, direction: "down", mark: "v" },
      { row: 6, col: 1, direction: "right", mark: "x" }, { row: 6, col: 2, direction: "down", mark: "v" },
      { row: 6, col: 4, direction: "down", mark: "x" }, { row: 6, col: 7, direction: "right", mark: "x" },
      { row: 7, col: 0, direction: "down", mark: "x" }, { row: 7, col: 2, direction: "right", mark: "v" },
      { row: 7, col: 7, direction: "down", mark: "x" }, { row: 7, col: 8, direction: "down", mark: "x" },
    ],
  },
} satisfies Content;

export const generated = { generator: "sudoku-xv", version: 1, seed: "roman-hand" } satisfies Provenance;
