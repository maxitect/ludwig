import type { Content } from "./schema";

/** Three titles for tests that need a small scene; not a real puzzle and not seeded. */
export const testScene = {
  sceneKey: "test-street",
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
