import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "high-stakes",
  title: "High Stakes",
  difficulty: 4,
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 1, col: 1, digit: 3 }, { row: 1, col: 4, digit: 4 }, { row: 2, col: 3, digit: 2 },
    { row: 4, col: 1, digit: 1 }, { row: 5, col: 5, digit: 4 },
  ],
  inequalities: [
    { row: 0, col: 4, direction: "down", relation: "lt" }, { row: 1, col: 2, direction: "right", relation: "gt" },
    { row: 1, col: 5, direction: "down", relation: "lt" }, { row: 2, col: 1, direction: "right", relation: "lt" },
    { row: 2, col: 4, direction: "right", relation: "lt" }, { row: 2, col: 5, direction: "down", relation: "lt" },
    { row: 4, col: 4, direction: "right", relation: "gt" }, { row: 5, col: 0, direction: "right", relation: "gt" },
    { row: 5, col: 4, direction: "right", relation: "lt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "high-stakes" } satisfies Provenance;
