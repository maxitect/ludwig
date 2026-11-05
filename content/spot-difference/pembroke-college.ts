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
    { x: 1012, y: 136, width: 96, height: 96 },
    { x: 796, y: 492, width: 96, height: 96 },
    { x: 560, y: 496, width: 96, height: 96 },
    { x: 1488, y: 1024, width: 112, height: 131 },
    { x: 512, y: 1052, width: 104, height: 96 },
  ],
} satisfies Content;
