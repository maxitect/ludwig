import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "long-odds",
  title: "Long Odds",
  difficulty: 5,
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 7,
  givens: [
    { row: 0, col: 1, digit: 3 }, { row: 1, col: 0, digit: 1 }, { row: 2, col: 2, digit: 7 },
    { row: 2, col: 3, digit: 2 }, { row: 3, col: 1, digit: 6 }, { row: 5, col: 1, digit: 4 },
    { row: 5, col: 2, digit: 2 }, { row: 5, col: 5, digit: 7 }, { row: 5, col: 6, digit: 1 },
    { row: 6, col: 0, digit: 4 }, { row: 6, col: 2, digit: 5 }, { row: 6, col: 6, digit: 3 },
  ],
  inequalities: [
    { row: 0, col: 6, direction: "down", relation: "gt" }, { row: 1, col: 2, direction: "right", relation: "lt" },
    { row: 1, col: 3, direction: "right", relation: "gt" }, { row: 2, col: 0, direction: "down", relation: "lt" },
    { row: 2, col: 5, direction: "right", relation: "gt" }, { row: 4, col: 3, direction: "down", relation: "gt" },
    { row: 5, col: 0, direction: "down", relation: "lt" }, { row: 5, col: 4, direction: "down", relation: "gt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "long-odds" } satisfies Provenance;
