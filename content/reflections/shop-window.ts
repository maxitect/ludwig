import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "shop-window",
  title: "Shop Window",
  difficulty: 1,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 5,
  cols: 5,
  fixedMirrors: [
    { row: 1, col: 0, mirror: "backslash" },
    { row: 1, col: 4, mirror: "backslash" },
    { row: 2, col: 1, mirror: "slash" },
    { row: 2, col: 4, mirror: "slash" },
    { row: 4, col: 4, mirror: "slash" },
  ],
  slots: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 2, col: 0 },
    { row: 2, col: 2 },
    { row: 4, col: 0 },
    { row: 4, col: 1 },
  ],
  ports: [
    { side: "n", offset: 4, label: "A" },
    { side: "w", offset: 1, label: "A" },
    { side: "s", offset: 0, label: "B" },
    { side: "s", offset: 1, label: "B" },
    { side: "n", offset: 1, label: "C" },
    { side: "n", offset: 3, label: "C" },
    { side: "n", offset: 2, label: "D" },
    { side: "e", offset: 2, label: "D" },
  ],
} satisfies Content;
