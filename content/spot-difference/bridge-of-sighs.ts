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
    { x: 816, y: 54, width: 60, height: 60 },
    { x: 876, y: 98, width: 60, height: 60 },
    { x: 606, y: 94, width: 60, height: 60 },
    { x: 168, y: 120, width: 60, height: 72 },
    { x: 80, y: 144, width: 88, height: 80 },
    { x: 826, y: 170, width: 60, height: 60 },
    { x: 818, y: 362, width: 60, height: 60 },
    { x: 254, y: 574, width: 60, height: 60 },
    { x: 834, y: 610, width: 60, height: 60 },
  ],
} satisfies Content;
