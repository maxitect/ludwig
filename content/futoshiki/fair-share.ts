import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "fair-share",
  title: "Fair Share",
  difficulty: 2,
  publishedAt: new Date("2026-10-07T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 5,
  givens: [
    { row: 0, col: 0, digit: 3 }, { row: 0, col: 1, digit: 4 }, { row: 1, col: 2, digit: 4 },
    { row: 1, col: 3, digit: 3 }, { row: 2, col: 2, digit: 2 }, { row: 3, col: 1, digit: 5 },
    { row: 4, col: 0, digit: 5 },
  ],
  inequalities: [
    { row: 1, col: 1, direction: "down", relation: "lt" }, { row: 3, col: 3, direction: "down", relation: "gt" },
  ],
} satisfies Content;

export const generated = { generator: "futoshiki", version: 1, seed: "fair-share" } satisfies Provenance;
