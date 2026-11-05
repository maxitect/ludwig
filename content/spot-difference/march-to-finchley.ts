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
    { x: 1168, y: 24, width: 72, height: 48 },
    { x: 840, y: 32, width: 80, height: 48 },
    { x: 1040, y: 40, width: 80, height: 48 },
    { x: 688, y: 88, width: 64, height: 48 },
    { x: 504, y: 144, width: 72, height: 48 },
    { x: 1376, y: 56, width: 80, height: 104 },
    { x: 1488, y: 128, width: 56, height: 88 },
    { x: 576, y: 240, width: 88, height: 76 },
    { x: 384, y: 376, width: 88, height: 76 },
    { x: 576, y: 452, width: 72, height: 88 },
    { x: 1048, y: 1112, width: 96, height: 56 },
    { x: 1320, y: 1144, width: 80, height: 52 },
  ],
} satisfies Content;
