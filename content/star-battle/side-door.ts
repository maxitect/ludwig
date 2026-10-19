import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "side-door",
  title: "Side Door",
  difficulty: 3,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 7,
  stars: 1,
  grid: [
    "2200011", "2222431", "2444433", "2444336", "4444336", "4455336", "4445366",
  ],
} satisfies Content;

export const generated = { generator: "star-battle", version: 1, seed: "side-door" } satisfies Provenance;
