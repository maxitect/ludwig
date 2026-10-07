import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/futoshiki/schema";

export const meta = {
  slug: "over-and-under",
  title: "Over and Under",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 5,
  givens: [

  ],
  inequalities: [
    { row: 0, col: 0, direction: "down", relation: "gt" }, { row: 0, col: 2, direction: "down", relation: "gt" },
    { row: 0, col: 2, direction: "right", relation: "lt" }, { row: 0, col: 3, direction: "right", relation: "lt" },
    { row: 0, col: 4, direction: "down", relation: "gt" }, { row: 1, col: 1, direction: "right", relation: "gt" },
    { row: 1, col: 3, direction: "down", relation: "lt" }, { row: 2, col: 0, direction: "right", relation: "lt" },
    { row: 2, col: 1, direction: "down", relation: "lt" }, { row: 2, col: 1, direction: "right", relation: "lt" },
    { row: 2, col: 3, direction: "down", relation: "gt" }, { row: 2, col: 3, direction: "right", relation: "gt" },
    { row: 3, col: 0, direction: "right", relation: "lt" }, { row: 3, col: 1, direction: "right", relation: "lt" },
    { row: 4, col: 0, direction: "right", relation: "lt" },
  ],
} satisfies Content;
