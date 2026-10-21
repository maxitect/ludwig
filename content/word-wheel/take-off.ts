import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-wheel/schema";

export const meta = {
  slug: "take-off",
  title: "Take Off",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  targetWord: "aeroplane",
  centrePosition: 4,
  scrambleSeed: 4104,
  minLength: 4,
} satisfies Content;
