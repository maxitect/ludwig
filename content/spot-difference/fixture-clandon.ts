import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "fixture-clandon",
  title: "Clandon House",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneKey: "fixture-clandon",
  differences: [
    { x: 408, y: 400, width: 80, height: 64 },
    { x: 816, y: 496, width: 48, height: 56 },
    { x: 528, y: 864, width: 88, height: 64 },
  ],
} satisfies Content;
