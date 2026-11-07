import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "double-take",
  title: "Double Take",
  difficulty: 1,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 7,
  fixedMirrors: [
    { row: 1, col: 5, mirror: "slash" },
    { row: 3, col: 1, mirror: "slash" },
    { row: 3, col: 2, mirror: "backslash" },
    { row: 3, col: 4, mirror: "backslash" },
    { row: 3, col: 5, mirror: "slash" },
    { row: 4, col: 0, mirror: "backslash" },
    { row: 5, col: 0, mirror: "backslash" },
    { row: 5, col: 1, mirror: "slash" },
    { row: 5, col: 3, mirror: "backslash" },
  ],
  slots: [
    { row: 0, col: 0 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
    { row: 0, col: 4 },
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 1, col: 6 },
    { row: 2, col: 3 },
    { row: 2, col: 4 },
    { row: 2, col: 6 },
    { row: 4, col: 6 },
    { row: 5, col: 6 },
  ],
  ports: [
    { side: "n", offset: 0, label: "A" },
    { side: "s", offset: 4, label: "A" },
    { side: "n", offset: 2, label: "B" },
    { side: "n", offset: 3, label: "B" },
    { side: "n", offset: 1, label: "C" },
    { side: "w", offset: 2, label: "C" },
    { side: "n", offset: 6, label: "D" },
    { side: "e", offset: 4, label: "D" },
    { side: "e", offset: 0, label: "E" },
    { side: "e", offset: 1, label: "E" },
  ],
} satisfies Content;
