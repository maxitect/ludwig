import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "narrow-margin",
  title: "Narrow Margin",
  difficulty: 4,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 3, digit: 4 }, { row: 1, col: 0, digit: 4 }, { row: 1, col: 3, digit: 2 },
    { row: 2, col: 3, digit: 6 }, { row: 2, col: 4, digit: 3 }, { row: 4, col: 0, digit: 6 },
    { row: 5, col: 5, digit: 4 },
  ],
  inequalities: [
    { row: 0, col: 0, direction: "down", relation: "gt" }, { row: 0, col: 3, direction: "right", relation: "lt" },
    { row: 2, col: 0, direction: "down", relation: "lt" }, { row: 2, col: 2, direction: "down", relation: "gt" },
    { row: 3, col: 2, direction: "down", relation: "gt" }, { row: 3, col: 3, direction: "down", relation: "gt" },
    { row: 3, col: 4, direction: "down", relation: "gt" }, { row: 4, col: 3, direction: "down", relation: "lt" },
    { row: 5, col: 1, direction: "right", relation: "lt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "narrow-margin" } satisfies Provenance;
