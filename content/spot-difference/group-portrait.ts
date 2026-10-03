import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "group-portrait",
  title: "Group Portrait",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneSeed: 1961,
  differenceCount: 5,
  generatorVersion: 1,
} satisfies Content;
