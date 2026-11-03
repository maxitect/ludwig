import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "prism-walk",
  title: "Prism Walk",
  difficulty: 3,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 6,
  fixedMirrors: [
    { row: 4, col: 5, mirror: "slash" }, { row: 6, col: 2, mirror: "slash" }, { row: 6, col: 3, mirror: "backslash" },
  ],
  slots: [
    { row: 0, col: 0 }, { row: 0, col: 4 }, { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 2, col: 1 },
    { row: 2, col: 3 }, { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 3 }, { row: 3, col: 5 },
    { row: 4, col: 0 }, { row: 4, col: 3 }, { row: 4, col: 4 }, { row: 6, col: 1 }, { row: 6, col: 4 },
    { row: 6, col: 5 },
  ],
  ports: [
    { side: "n", offset: 3, label: "A" }, { side: "e", offset: 0, label: "A" }, { side: "e", offset: 2, label: "B" },
    { side: "w", offset: 6, label: "B" }, { side: "e", offset: 4, label: "C" }, { side: "w", offset: 2, label: "C" },
    { side: "w", offset: 0, label: "D" }, { side: "w", offset: 3, label: "D" },
  ],
} satisfies Content;

export const generated = { generator: "reflections", version: 1, seed: "prism-walk" } satisfies Provenance;
