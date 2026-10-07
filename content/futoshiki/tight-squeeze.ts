import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "tight-squeeze",
  title: "Tight Squeeze",
  difficulty: 3,
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 2, digit: 6 }, { row: 1, col: 3, digit: 6 }, { row: 3, col: 0, digit: 1 },
    { row: 4, col: 3, digit: 3 }, { row: 4, col: 5, digit: 5 }, { row: 5, col: 0, digit: 2 },
    { row: 5, col: 1, digit: 5 }, { row: 5, col: 2, digit: 1 },
  ],
  inequalities: [
    { row: 0, col: 0, direction: "down", relation: "gt" }, { row: 0, col: 1, direction: "down", relation: "lt" },
    { row: 0, col: 4, direction: "down", relation: "lt" }, { row: 1, col: 0, direction: "down", relation: "gt" },
    { row: 2, col: 1, direction: "right", relation: "gt" }, { row: 4, col: 1, direction: "right", relation: "lt" },
    { row: 5, col: 3, direction: "right", relation: "lt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "tight-squeeze" } satisfies Provenance;
