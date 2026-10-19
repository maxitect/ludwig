import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "ink-blots",
  title: "Ink Blots",
  difficulty: 1,
  publishedAt: new Date("2026-10-13T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 6,
  cols: 6,
  grid: ["012211", "011111", "111133", "134433", "133335", "166335"],
} satisfies Content;
