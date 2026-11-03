import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "glass-alley",
  title: "Glass Alley",
  difficulty: 2,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  fixedMirrors: [
    { row: 0, col: 5, mirror: "slash" },
    { row: 1, col: 4, mirror: "backslash" },
    { row: 3, col: 0, mirror: "slash" },
    { row: 3, col: 1, mirror: "backslash" },
    { row: 3, col: 2, mirror: "backslash" },
    { row: 4, col: 2, mirror: "slash" },
    { row: 4, col: 3, mirror: "backslash" },
    { row: 5, col: 1, mirror: "backslash" },
  ],
  slots: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 5 },
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 4, col: 1 },
    { row: 4, col: 5 },
    { row: 5, col: 2 },
    { row: 5, col: 3 },
    { row: 5, col: 5 },
  ],
  ports: [
    { side: "w", offset: 0, label: "A" },
    { side: "w", offset: 2, label: "A" },
    { side: "e", offset: 1, label: "B" },
    { side: "e", offset: 4, label: "B" },
    { side: "n", offset: 1, label: "C" },
    { side: "n", offset: 5, label: "C" },
    { side: "n", offset: 3, label: "D" },
    { side: "e", offset: 2, label: "D" },
  ],
} satisfies Content;
