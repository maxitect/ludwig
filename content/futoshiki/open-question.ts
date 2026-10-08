import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "open-question",
  title: "Open Question",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 0, digit: 1 }, { row: 1, col: 4, digit: 6 }, { row: 2, col: 4, digit: 4 },
    { row: 3, col: 0, digit: 4 }, { row: 4, col: 5, digit: 4 }, { row: 5, col: 3, digit: 4 },
    { row: 5, col: 5, digit: 3 },
  ],
  inequalities: [
    { row: 0, col: 3, direction: "right", relation: "gt" }, { row: 1, col: 5, direction: "down", relation: "gt" },
    { row: 2, col: 0, direction: "right", relation: "lt" }, { row: 3, col: 0, direction: "down", relation: "gt" },
    { row: 3, col: 1, direction: "down", relation: "lt" }, { row: 3, col: 2, direction: "right", relation: "lt" },
    { row: 4, col: 0, direction: "right", relation: "gt" }, { row: 4, col: 4, direction: "right", relation: "gt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "open-question" } satisfies Provenance;
