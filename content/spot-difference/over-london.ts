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
    { x: 566, y: 2, width: 60, height: 60 },
    { x: 262, y: 82, width: 60, height: 60 },
    { x: 386, y: 82, width: 60, height: 60 },
    { x: 102, y: 106, width: 60, height: 60 },
    { x: 314, y: 304, width: 60, height: 96 },
    { x: 178, y: 328, width: 60, height: 104 },
    { x: 858, y: 400, width: 60, height: 72 },
    { x: 510, y: 446, width: 60, height: 60 },
    { x: 266, y: 528, width: 60, height: 80 },
    { x: 66, y: 560, width: 60, height: 72 },
  ],
} satisfies Content;
