import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-wheel/schema";

export const meta = {
  slug: "flat-hunt",
  title: "Flat Hunt",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  targetWord: "apartment",
  centrePosition: 3,
  scrambleSeed: 4103,
  minLength: 5,
} satisfies Content;
