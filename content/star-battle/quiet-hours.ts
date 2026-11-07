import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/star-battle/schema";

export const meta = {
  slug: "quiet-hours",
  title: "Quiet Hours",
  difficulty: 2,
  publishedAt: new Date("2026-10-13T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  size: 7,
  stars: 1,
  grid: [
    "0000222", "1100222", "1222222", "1112223", "4115533", "4555536", "4556666",
  ],
} satisfies Content;

export const generated = { generator: "star-battle", version: 1, seed: "quiet-hours" } satisfies Provenance;
