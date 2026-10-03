import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "stately-home",
  title: "Stately Home",
  difficulty: 4,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneSeed: 1666,
  differenceCount: 11,
  generatorVersion: 1,
} satisfies Content;
