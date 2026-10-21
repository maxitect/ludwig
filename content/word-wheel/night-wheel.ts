import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-wheel/schema";

export const meta = {
  slug: "night-wheel",
  title: "Night Wheel",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  targetWord: "adventure",
  centrePosition: 2,
  scrambleSeed: 4101,
  minLength: 4,
} satisfies Content;
