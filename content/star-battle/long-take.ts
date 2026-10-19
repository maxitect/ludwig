import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "long-take",
  title: "Long Take",
  difficulty: 4,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 9,
  stars: 1,
  grid: [
    "200033111", "222233131", "222223333", "222223333", "222333344", "252244448", "555688888", "558666887", "558888877",
  ],
} satisfies Content;

export const generated = { generator: "star-battle", version: 1, seed: "long-take" } satisfies Provenance;
