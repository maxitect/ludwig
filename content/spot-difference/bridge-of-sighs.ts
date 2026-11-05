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
    { x: 1306, y: 88, width: 96, height: 96 },
    { x: 1406, y: 152, width: 96, height: 96 },
    { x: 976, y: 144, width: 96, height: 96 },
    { x: 268, y: 192, width: 96, height: 112 },
    { x: 128, y: 232, width: 136, height: 120 },
    { x: 1316, y: 268, width: 96, height: 96 },
    { x: 1320, y: 592, width: 96, height: 96 },
    { x: 408, y: 920, width: 96, height: 96 },
    { x: 1332, y: 968, width: 96, height: 96 },
  ],
} satisfies Content;
