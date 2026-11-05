import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "erthig-hall",
  title: "Erthig Hall",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneKey: "erthig-hall",
  differences: [
    { x: 936, y: 200, width: 72, height: 48 },
    { x: 796, y: 356, width: 56, height: 80 },
    { x: 828, y: 444, width: 48, height: 64 },
    { x: 1208, y: 848, width: 92, height: 88 },
    { x: 740, y: 964, width: 64, height: 64 },
    { x: 212, y: 972, width: 80, height: 64 },
    { x: 908, y: 972, width: 56, height: 48 },
  ],
} satisfies Content;
