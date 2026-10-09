import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/sightlines/schema";

export const meta = {
  slug: "chapel-aisle",
  title: "Chapel Aisle",
  difficulty: 4,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    ".........",
    ".#.#.#.#.",
    ".........",
    ".#.#.#.#.",
    ".........",
    ".#.#.#.#.",
    ".........",
    ".#.#.#.#.",
    ".........",
  ],
  targetRow: 4,
  targetCol: 3,
  observers: [
    { row: 0, col: 0, facing: "se", fovDeg: 90 },
    { row: 8, col: 8, facing: "nw", fovDeg: 90 },
    { row: 0, col: 8, facing: "sw", fovDeg: 90 },
    { row: 8, col: 0, facing: "ne", fovDeg: 90 },
  ],
} satisfies Content;
