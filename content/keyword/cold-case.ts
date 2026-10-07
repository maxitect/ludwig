import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/keyword/schema";

export const meta = {
  slug: "cold-case",
  title: "Cold Case",
  difficulty: 4,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "the clue was hidden where the light never reached",
  keyword: "crayon",
} satisfies Content;
