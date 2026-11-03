import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "silvering",
  title: "Silvering",
  difficulty: 2,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 5,
  cols: 6,
  fixedMirrors: [
    { row: 0, col: 5, mirror: "backslash" }, { row: 2, col: 0, mirror: "slash" }, { row: 2, col: 1, mirror: "slash" },
    { row: 3, col: 0, mirror: "backslash" }, { row: 3, col: 2, mirror: "backslash" },
    { row: 4, col: 0, mirror: "slash" }, { row: 4, col: 1, mirror: "slash" }, { row: 4, col: 2, mirror: "slash" },
    { row: 4, col: 3, mirror: "slash" },
  ],
  slots: [
    { row: 0, col: 0 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 1, col: 1 },
    { row: 1, col: 4 }, { row: 1, col: 5 }, { row: 2, col: 2 }, { row: 2, col: 5 }, { row: 3, col: 3 },
    { row: 3, col: 5 },
  ],
  ports: [
    { side: "n", offset: 0, label: "A" }, { side: "n", offset: 1, label: "A" }, { side: "e", offset: 2, label: "B" },
    { side: "s", offset: 4, label: "B" },
  ],
} satisfies Content;

export const generated = { generator: "reflections", version: 1, seed: "silvering" } satisfies Provenance;
