import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "x-marks-the-spot",
  title: "X Marks the Spot",
  difficulty: 2,
  publishedAt: new Date("2026-10-15T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 4, col: 1, digit: 6 }, { row: 4, col: 5, digit: 8 },
  ],
  xv: {
    marks: [
      { row: 0, col: 0, direction: "down", mark: "x" }, { row: 0, col: 1, direction: "down", mark: "v" },
      { row: 0, col: 2, direction: "right", mark: "x" }, { row: 0, col: 5, direction: "right", mark: "x" },
      { row: 1, col: 2, direction: "right", mark: "x" }, { row: 1, col: 6, direction: "right", mark: "x" },
      { row: 1, col: 8, direction: "down", mark: "x" }, { row: 2, col: 5, direction: "down", mark: "x" },
      { row: 3, col: 0, direction: "right", mark: "v" }, { row: 3, col: 3, direction: "down", mark: "x" },
      { row: 3, col: 4, direction: "right", mark: "x" }, { row: 4, col: 0, direction: "down", mark: "v" },
      { row: 4, col: 7, direction: "down", mark: "x" }, { row: 4, col: 8, direction: "down", mark: "x" },
      { row: 5, col: 0, direction: "down", mark: "x" }, { row: 5, col: 2, direction: "down", mark: "x" },
      { row: 5, col: 4, direction: "right", mark: "v" }, { row: 5, col: 4, direction: "down", mark: "x" },
      { row: 5, col: 5, direction: "down", mark: "x" }, { row: 5, col: 6, direction: "down", mark: "v" },
      { row: 6, col: 1, direction: "right", mark: "x" }, { row: 6, col: 2, direction: "down", mark: "v" },
      { row: 6, col: 7, direction: "right", mark: "v" }, { row: 6, col: 7, direction: "down", mark: "x" },
      { row: 7, col: 2, direction: "right", mark: "x" }, { row: 7, col: 5, direction: "down", mark: "x" },
      { row: 7, col: 8, direction: "down", mark: "x" }, { row: 8, col: 1, direction: "right", mark: "x" },
      { row: 8, col: 2, direction: "right", mark: "v" }, { row: 8, col: 4, direction: "right", mark: "v" },
    ],
  },
} satisfies Content;
