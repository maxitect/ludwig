import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "loose-end",
  title: "Loose End",
  difficulty: 4,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  givens: [
    { row: 0, col: 1, digit: 3 }, { row: 0, col: 3, digit: 2 }, { row: 0, col: 5, digit: 6 },
    { row: 3, col: 2, digit: 2 }, { row: 4, col: 2, digit: 5 }, { row: 4, col: 5, digit: 4 },
    { row: 5, col: 3, digit: 3 }, { row: 5, col: 4, digit: 4 },
  ],
  inequalities: [
    { row: 1, col: 1, direction: "right", relation: "gt" }, { row: 1, col: 2, direction: "right", relation: "lt" },
    { row: 1, col: 3, direction: "down", relation: "lt" }, { row: 1, col: 4, direction: "right", relation: "lt" },
    { row: 2, col: 0, direction: "down", relation: "lt" }, { row: 2, col: 3, direction: "right", relation: "gt" },
    { row: 3, col: 0, direction: "right", relation: "lt" }, { row: 4, col: 3, direction: "right", relation: "gt" },
    { row: 5, col: 4, direction: "right", relation: "gt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "loose-end" } satisfies Provenance;
