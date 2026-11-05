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
    { x: 726, y: 0, width: 60, height: 60 },
    { x: 520, y: 14, width: 80, height: 60 },
    { x: 646, y: 14, width: 60, height: 60 },
    { x: 422, y: 42, width: 60, height: 60 },
    { x: 310, y: 70, width: 60, height: 60 },
    { x: 858, y: 38, width: 60, height: 60 },
    { x: 606, y: 254, width: 60, height: 60 },
    { x: 358, y: 146, width: 60, height: 60 },
    { x: 266, y: 238, width: 60, height: 60 },
    { x: 686, y: 184, width: 60, height: 72 },
    { x: 666, y: 682, width: 60, height: 60 },
    { x: 822, y: 688, width: 60, height: 60 },
  ],
} satisfies Content;
