import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "final-cut",
  title: "Final Cut",
  difficulty: 5,
  publishedAt: new Date("2026-10-19T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 9,
  stars: 1,
  grid: [
    "000000003", "220021033", "222221333", "244221133", "244551333", "244451333", "264773333", "866773733", "886677777",
  ],
} satisfies Content;

export const generated = { generator: "star-battle", version: 1, seed: "final-cut" } satisfies Provenance;
