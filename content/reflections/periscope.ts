import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/reflections/schema";

export const meta = {
  slug: "periscope",
  title: "Periscope",
  difficulty: 1,
  publishedAt: new Date("2026-11-03T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 4,
  cols: 4,
  fixedMirrors: [
    { row: 3, col: 0, mirror: "backslash" }, { row: 3, col: 3, mirror: "backslash" },
  ],
  slots: [
    { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  ],
  ports: [
    { side: "e", offset: 1, label: "A" }, { side: "s", offset: 2, label: "A" }, { side: "w", offset: 0, label: "B" },
    { side: "w", offset: 1, label: "B" },
  ],
} satisfies Content;

export const generated = { generator: "reflections", version: 1, seed: "periscope" } satisfies Provenance;
