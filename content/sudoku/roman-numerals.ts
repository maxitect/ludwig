import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sudoku/schema";

export const meta = {
  slug: "roman-numerals",
  title: "Roman Numerals",
  difficulty: 3,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  givens: [
    { row: 0, col: 6, digit: 4 }, { row: 6, col: 3, digit: 2 },
  ],
  xv: {
    marks: [
      { row: 0, col: 0, direction: "right", mark: "x" }, { row: 0, col: 2, direction: "right", mark: "x" },
      { row: 0, col: 3, direction: "down", mark: "x" }, { row: 0, col: 6, direction: "down", mark: "x" },
      { row: 0, col: 7, direction: "right", mark: "x" }, { row: 1, col: 1, direction: "right", mark: "x" },
      { row: 1, col: 4, direction: "right", mark: "x" }, { row: 1, col: 4, direction: "down", mark: "v" },
      { row: 2, col: 2, direction: "right", mark: "v" }, { row: 2, col: 4, direction: "right", mark: "x" },
      { row: 2, col: 6, direction: "right", mark: "x" }, { row: 3, col: 1, direction: "right", mark: "x" },
      { row: 3, col: 5, direction: "right", mark: "v" }, { row: 3, col: 6, direction: "right", mark: "x" },
      { row: 4, col: 0, direction: "down", mark: "x" }, { row: 4, col: 1, direction: "down", mark: "x" },
      { row: 4, col: 4, direction: "down", mark: "x" }, { row: 4, col: 5, direction: "down", mark: "v" },
      { row: 4, col: 7, direction: "right", mark: "x" }, { row: 5, col: 2, direction: "right", mark: "x" },
      { row: 5, col: 2, direction: "down", mark: "x" }, { row: 5, col: 7, direction: "right", mark: "x" },
      { row: 6, col: 3, direction: "right", mark: "x" }, { row: 6, col: 7, direction: "right", mark: "v" },
      { row: 7, col: 0, direction: "down", mark: "x" }, { row: 7, col: 1, direction: "right", mark: "v" },
      { row: 7, col: 4, direction: "right", mark: "x" }, { row: 8, col: 3, direction: "right", mark: "x" },
    ],
  },
} satisfies Content;
