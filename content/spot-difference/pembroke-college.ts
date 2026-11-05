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
    { x: 1024, y: 160, width: 72, height: 48 },
    { x: 816, y: 488, width: 56, height: 104 },
    { x: 560, y: 496, width: 96, height: 96 },
    { x: 424, y: 880, width: 56, height: 80 },
    { x: 504, y: 1064, width: 120, height: 72 },
  ],
} satisfies Content;
