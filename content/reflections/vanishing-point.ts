import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "vanishing-point",
  title: "Vanishing Point",
  difficulty: 5,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 9,
  cols: 8,
  fixedMirrors: [
    { row: 0, col: 0, mirror: "backslash" }, { row: 0, col: 1, mirror: "slash" },
    { row: 0, col: 2, mirror: "backslash" }, { row: 0, col: 5, mirror: "backslash" },
    { row: 0, col: 7, mirror: "slash" }, { row: 1, col: 0, mirror: "backslash" },
    { row: 1, col: 1, mirror: "backslash" }, { row: 1, col: 2, mirror: "backslash" },
    { row: 1, col: 4, mirror: "slash" }, { row: 1, col: 7, mirror: "backslash" },
    { row: 2, col: 1, mirror: "backslash" }, { row: 3, col: 2, mirror: "slash" }, { row: 4, col: 0, mirror: "slash" },
    { row: 4, col: 1, mirror: "slash" }, { row: 4, col: 2, mirror: "slash" }, { row: 4, col: 7, mirror: "backslash" },
    { row: 5, col: 0, mirror: "slash" }, { row: 5, col: 1, mirror: "slash" }, { row: 5, col: 2, mirror: "slash" },
    { row: 5, col: 3, mirror: "backslash" }, { row: 5, col: 5, mirror: "backslash" },
    { row: 5, col: 6, mirror: "backslash" }, { row: 7, col: 0, mirror: "slash" },
    { row: 7, col: 1, mirror: "backslash" }, { row: 8, col: 0, mirror: "backslash" },
  ],
  slots: [
    { row: 0, col: 6 }, { row: 2, col: 7 }, { row: 3, col: 5 }, { row: 3, col: 7 }, { row: 4, col: 3 },
    { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 5, col: 7 }, { row: 6, col: 3 }, { row: 6, col: 5 },
    { row: 6, col: 6 }, { row: 7, col: 2 }, { row: 7, col: 3 }, { row: 7, col: 4 }, { row: 7, col: 5 },
    { row: 7, col: 6 },
  ],
  ports: [
    { side: "n", offset: 5, label: "A" }, { side: "w", offset: 6, label: "A" }, { side: "e", offset: 2, label: "B" },
    { side: "s", offset: 2, label: "B" }, { side: "e", offset: 7, label: "C" }, { side: "s", offset: 6, label: "C" },
  ],
} satisfies Content;

export const generated = { generator: "reflections", version: 1, seed: "vanishing-point" } satisfies Provenance;
