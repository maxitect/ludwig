import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "bridge-of-sighs",
  title: "The Bridge of Sighs",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneKey: "bridge-of-sighs",
  differences: [
    { x: 1336, y: 92, width: 60, height: 88 },
    { x: 1412, y: 164, width: 56, height: 72 },
    { x: 984, y: 168, width: 72, height: 56 },
    { x: 264, y: 184, width: 56, height: 128 },
    { x: 120, y: 224, width: 142, height: 136 },
    { x: 1328, y: 264, width: 96, height: 128 },
    { x: 1320, y: 584, width: 96, height: 120 },
    { x: 664, y: 920, width: 80, height: 56 },
    { x: 1344, y: 976, width: 72, height: 80 },
  ],
} satisfies Content;
