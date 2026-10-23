import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "ring-road",
  title: "Ring Road",
  difficulty: 2,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    ".5...1...", "...8..737", "746.3....", "..397....", "9.8..2.8.", "2....9151", "..1..1...", "..61.....", ".7...18.4",
  ],
} satisfies Content;

export const generated = { generator: "circle9", version: 1, seed: "ring-road" } satisfies Provenance;
