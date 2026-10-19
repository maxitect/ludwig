import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "night-train",
  title: "Night Train",
  difficulty: 2,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  stars: 1,
  grid: [
    "111000", "122033", "522043", "555443", "555445", "555555",
  ],
} satisfies Content;

export const generated = { generator: "star-battle", version: 1, seed: "night-train" } satisfies Provenance;
