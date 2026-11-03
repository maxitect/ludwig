import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "kaleidoscope",
  title: "Kaleidoscope",
  difficulty: 4,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 8,
  cols: 7,
  fixedMirrors: [
    { row: 0, col: 0, mirror: "backslash" }, { row: 0, col: 1, mirror: "slash" }, { row: 0, col: 3, mirror: "slash" },
    { row: 0, col: 4, mirror: "slash" }, { row: 1, col: 0, mirror: "backslash" },
    { row: 1, col: 2, mirror: "backslash" }, { row: 3, col: 0, mirror: "slash" },
    { row: 5, col: 0, mirror: "backslash" }, { row: 5, col: 3, mirror: "backslash" },
    { row: 5, col: 4, mirror: "backslash" }, { row: 6, col: 6, mirror: "slash" }, { row: 7, col: 0, mirror: "slash" },
  ],
  slots: [
    { row: 1, col: 1 }, { row: 1, col: 6 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
    { row: 3, col: 1 }, { row: 3, col: 5 }, { row: 4, col: 3 }, { row: 4, col: 5 }, { row: 4, col: 6 },
    { row: 5, col: 1 }, { row: 5, col: 5 }, { row: 6, col: 3 }, { row: 7, col: 2 }, { row: 7, col: 3 },
    { row: 7, col: 4 },
  ],
  ports: [
    { side: "e", offset: 0, label: "A" }, { side: "e", offset: 2, label: "A" }, { side: "e", offset: 1, label: "B" },
    { side: "e", offset: 4, label: "B" }, { side: "e", offset: 3, label: "C" }, { side: "s", offset: 1, label: "C" },
    { side: "e", offset: 5, label: "D" }, { side: "w", offset: 2, label: "D" }, { side: "s", offset: 3, label: "E" },
    { side: "w", offset: 4, label: "E" },
  ],
} satisfies Content;

export const generated = { generator: "reflections", version: 1, seed: "kaleidoscope" } satisfies Provenance;
