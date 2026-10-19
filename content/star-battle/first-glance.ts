import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "first-glance",
  title: "First Glance",
  difficulty: 1,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 6,
  stars: 1,
  grid: [
    "001122", "033122", "033322", "533332", "534442", "544422",
  ],
} satisfies Content;

export const generated = { generator: "star-battle", version: 1, seed: "first-glance" } satisfies Provenance;
