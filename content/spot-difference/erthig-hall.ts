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
    { x: 576, y: 114, width: 64, height: 60 },
    { x: 482, y: 216, width: 60, height: 60 },
    { x: 502, y: 276, width: 60, height: 60 },
    { x: 718, y: 362, width: 60, height: 60 },
    { x: 714, y: 538, width: 60, height: 60 },
    { x: 450, y: 586, width: 60, height: 60 },
    { x: 126, y: 598, width: 60, height: 60 },
  ],
} satisfies Content;
