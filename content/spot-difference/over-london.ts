import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/spot-difference/schema";

export const meta = {
  slug: "over-london",
  title: "Over London, by Rail",
  difficulty: 4,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneKey: "over-london",
  differences: [
    { x: 912, y: 24, width: 80, height: 48 },
    { x: 432, y: 112, width: 72, height: 112 },
    { x: 632, y: 136, width: 56, height: 80 },
    { x: 176, y: 176, width: 72, height: 72 },
    { x: 512, y: 488, width: 80, height: 168 },
    { x: 288, y: 520, width: 96, height: 168 },
    { x: 1384, y: 640, width: 72, height: 120 },
    { x: 824, y: 720, width: 80, height: 80 },
    { x: 424, y: 832, width: 104, height: 144 },
    { x: 112, y: 896, width: 88, height: 120 },
  ],
} satisfies Content;
