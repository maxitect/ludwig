import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "march-to-finchley",
  title: "The March to Finchley",
  difficulty: 5,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneKey: "march-to-finchley",
  differences: [
    { x: 1152, y: 0, width: 96, height: 96 },
    { x: 840, y: 20, width: 112, height: 96 },
    { x: 1036, y: 16, width: 96, height: 96 },
    { x: 672, y: 68, width: 96, height: 96 },
    { x: 492, y: 116, width: 96, height: 96 },
    { x: 1368, y: 60, width: 96, height: 96 },
    { x: 1472, y: 136, width: 96, height: 96 },
    { x: 572, y: 232, width: 96, height: 96 },
    { x: 384, y: 372, width: 136, height: 96 },
    { x: 1100, y: 296, width: 96, height: 112 },
    { x: 1048, y: 1092, width: 96, height: 96 },
    { x: 1312, y: 1100, width: 96, height: 97 },
  ],
} satisfies Content;
