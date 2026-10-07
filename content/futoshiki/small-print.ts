import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "small-print",
  title: "Small Print",
  difficulty: 1,
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 5,
  givens: [
    { row: 0, col: 0, digit: 1 }, { row: 0, col: 1, digit: 3 }, { row: 1, col: 1, digit: 1 },
    { row: 1, col: 3, digit: 2 }, { row: 2, col: 4, digit: 2 }, { row: 3, col: 3, digit: 5 },
    { row: 4, col: 0, digit: 5 },
  ],
  inequalities: [
    { row: 1, col: 3, direction: "down", relation: "lt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "small-print" } satisfies Provenance;
