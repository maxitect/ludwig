import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-wheel/schema";

export const meta = {
  slug: "dead-hours",
  title: "Dead Hours",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  targetWord: "afternoon",
  centrePosition: 0,
  scrambleSeed: 4105,
  minLength: 4,
} satisfies Content;
