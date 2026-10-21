import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-wheel/schema";

export const meta = {
  slug: "hospital-run",
  title: "Hospital Run",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  targetWord: "ambulance",
  centrePosition: 1,
  scrambleSeed: 4102,
  minLength: 4,
} satisfies Content;
