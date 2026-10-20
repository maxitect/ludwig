import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "tally-marks",
  title: "Tally Marks",
  difficulty: 4,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 7, digit: 6 }, { row: 1, col: 7, digit: 8 }, { row: 3, col: 1, digit: 4 },
  ],
  xv: {
    marks: [
      { row: 0, col: 2, direction: "down", mark: "x" }, { row: 0, col: 3, direction: "down", mark: "x" },
      { row: 0, col: 4, direction: "down", mark: "v" }, { row: 0, col: 7, direction: "right", mark: "x" },
      { row: 1, col: 0, direction: "right", mark: "v" }, { row: 1, col: 0, direction: "down", mark: "x" },
      { row: 2, col: 6, direction: "down", mark: "v" }, { row: 3, col: 0, direction: "down", mark: "x" },
      { row: 3, col: 1, direction: "right", mark: "x" }, { row: 3, col: 5, direction: "right", mark: "v" },
      { row: 3, col: 6, direction: "down", mark: "x" }, { row: 3, col: 8, direction: "down", mark: "x" },
      { row: 4, col: 7, direction: "right", mark: "v" }, { row: 5, col: 1, direction: "right", mark: "x" },
      { row: 5, col: 4, direction: "down", mark: "x" }, { row: 6, col: 1, direction: "down", mark: "x" },
      { row: 6, col: 2, direction: "right", mark: "x" }, { row: 6, col: 3, direction: "down", mark: "v" },
      { row: 6, col: 4, direction: "right", mark: "x" }, { row: 6, col: 5, direction: "right", mark: "v" },
      { row: 6, col: 5, direction: "down", mark: "v" }, { row: 8, col: 7, direction: "right", mark: "v" },
    ],
  },
} satisfies Content;

export const generated = { generator: "sudoku-xv", version: 1, seed: "tally-marks" } satisfies Provenance;
