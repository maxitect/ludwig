import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/detective-scene/schema";

export const meta = {
  slug: "fixture-street",
  title: "Fixture Street",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  sceneKey: "fixture-street",
  width: 1200,
  height: 800,
  items: [
    { title: "The Sweeney", x: 120, y: 470, width: 260, height: 60, aliases: [] },
    {
      title: "Starsky & Hutch",
      x: 520,
      y: 260,
      width: 170,
      height: 120,
      aliases: [],
    },
    {
      title: "Inspector Morse",
      x: 900,
      y: 330,
      width: 220,
      height: 70,
      aliases: ["Morse"],
    },
  ],
} satisfies Content;
