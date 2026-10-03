import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "away-day",
  title: "Away Day",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneSeed: 2024,
  differenceCount: 8,
  generatorVersion: 1,
} satisfies Content;
