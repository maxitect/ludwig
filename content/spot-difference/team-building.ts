import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "team-building",
  title: "Team Building",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneSeed: 1902,
  differenceCount: 3,
  generatorVersion: 1,
} satisfies Content;
