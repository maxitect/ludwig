import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "hats-and-ties",
  title: "Hats and Ties",
  difficulty: 5,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneSeed: 1989,
  differenceCount: 15,
  generatorVersion: 1,
} satisfies Content;
