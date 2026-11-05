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
    { x: 904, y: 4, width: 96, height: 96 },
    { x: 420, y: 120, width: 96, height: 96 },
    { x: 612, y: 128, width: 96, height: 96 },
    { x: 164, y: 168, width: 96, height: 96 },
    { x: 504, y: 496, width: 96, height: 160 },
    { x: 284, y: 536, width: 96, height: 144 },
    { x: 1372, y: 648, width: 96, height: 104 },
    { x: 816, y: 712, width: 96, height: 96 },
    { x: 428, y: 840, width: 96, height: 128 },
    { x: 108, y: 904, width: 96, height: 104 },
  ],
} satisfies Content;
