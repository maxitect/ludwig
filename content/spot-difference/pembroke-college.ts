import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "pembroke-college",
  title: "Pembroke College",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneKey: "pembroke-college",
  differences: [
    { x: 630, y: 86, width: 60, height: 60 },
    { x: 498, y: 310, width: 60, height: 60 },
    { x: 350, y: 310, width: 60, height: 60 },
    { x: 936, y: 640, width: 64, height: 82 },
    { x: 320, y: 658, width: 72, height: 60 },
  ],
} satisfies Content;
