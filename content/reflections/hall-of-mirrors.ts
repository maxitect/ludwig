import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "hall-of-mirrors",
  title: "Hall of Mirrors",
  difficulty: 1,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  fixedMirrors: [
    { row: 0, col: 6, mirror: "slash" },
    { row: 1, col: 5, mirror: "backslash" },
    { row: 2, col: 1, mirror: "slash" },
    { row: 2, col: 3, mirror: "slash" },
    { row: 2, col: 4, mirror: "backslash" },
    { row: 4, col: 1, mirror: "slash" },
    { row: 4, col: 6, mirror: "slash" },
    { row: 5, col: 4, mirror: "slash" },
    { row: 6, col: 0, mirror: "slash" },
    { row: 6, col: 3, mirror: "slash" },
    { row: 6, col: 5, mirror: "slash" },
  ],
  slots: [
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 1, col: 4 },
    { row: 2, col: 2 },
    { row: 3, col: 0 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
    { row: 4, col: 0 },
    { row: 4, col: 2 },
    { row: 5, col: 0 },
    { row: 5, col: 1 },
    { row: 5, col: 5 },
  ],
  ports: [
    { side: "n", offset: 0, label: "A" },
    { side: "w", offset: 5, label: "A" },
    { side: "n", offset: 3, label: "B" },
    { side: "e", offset: 2, label: "B" },
    { side: "e", offset: 3, label: "C" },
    { side: "s", offset: 2, label: "C" },
    { side: "s", offset: 3, label: "D" },
    { side: "s", offset: 4, label: "D" },
    { side: "e", offset: 0, label: "E" },
    { side: "w", offset: 0, label: "E" },
    { side: "n", offset: 1, label: "F" },
    { side: "s", offset: 0, label: "F" },
  ],
} satisfies Content;
