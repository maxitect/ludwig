import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "full-stop",
  title: "Full Stop",
  difficulty: 4,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    ".1.2..431", "33568.465", "....89...", "..41..5.8", "...491.28", "638..313.", ".7.3..178", "..9.2....", "8....5568",
  ],
} satisfies Content;

export const generated = { generator: "circle9", version: 1, seed: "full-stop" } satisfies Provenance;
