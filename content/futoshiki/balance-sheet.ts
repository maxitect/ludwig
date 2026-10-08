import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "balance-sheet",
  title: "Balance Sheet",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 2, digit: 3 }, { row: 1, col: 1, digit: 3 }, { row: 1, col: 4, digit: 4 },
    { row: 2, col: 3, digit: 5 }, { row: 3, col: 3, digit: 4 }, { row: 4, col: 3, digit: 3 },
    { row: 5, col: 5, digit: 6 },
  ],
  inequalities: [
    { row: 0, col: 1, direction: "right", relation: "lt" }, { row: 0, col: 4, direction: "down", relation: "lt" },
    { row: 1, col: 0, direction: "down", relation: "lt" }, { row: 2, col: 1, direction: "down", relation: "gt" },
    { row: 2, col: 2, direction: "down", relation: "gt" }, { row: 2, col: 4, direction: "right", relation: "gt" },
    { row: 3, col: 0, direction: "down", relation: "lt" }, { row: 4, col: 1, direction: "down", relation: "gt" },
    { row: 4, col: 2, direction: "down", relation: "lt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "balance-sheet" } satisfies Provenance;
