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
    { x: 924, y: 180, width: 96, height: 96 },
    { x: 776, y: 342, width: 96, height: 96 },
    { x: 804, y: 442, width: 96, height: 96 },
    { x: 1152, y: 576, width: 96, height: 96 },
    { x: 1140, y: 864, width: 96, height: 96 },
    { x: 724, y: 948, width: 96, height: 96 },
    { x: 204, y: 956, width: 96, height: 96 },
  ],
} satisfies Content;
