import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "locked-room",
  title: "Locked Room",
  difficulty: 5,
  publishedAt: new Date("2026-11-02T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  grid: [
    "6aaddgggbb", "6addddggff", "6acdj999ff", "cccjjh97ff", "c3cjjhh772", "c3jjjhhhh2", "c3eeii8hh5", "1eeiii8805",
    "1e44ii8805", "eee4ii5555",
  ],
} satisfies Content;

export const generated = { generator: "norinori", version: 1, seed: "locked-room" } satisfies Provenance;
