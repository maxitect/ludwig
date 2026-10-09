import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/odd-one-out/schema";

export const meta = {
  slug: "mirror-mirror",
  title: "Mirror, Mirror",
  difficulty: 2,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  reviewNote:
    "Level, radar, civic and rotor read the same backwards as forwards; rotate does not (etator). It is also the only six-letter word, which points to the same item. All five are ordinary English words and none is a name or an abbreviation, so no rival rule leaves a different item out.",
} satisfies ContentMeta;

export const content = {
  promptText: "Four of these words have something in common. Which is the odd one out?",
  items: ["Rotate", "Level", "Radar", "Civic", "Rotor"],
  solution: {
    itemPosition: 0,
    explanation:
      "Level, radar, civic and rotor are palindromes, spelt the same in either direction. Rotate backwards is etator.",
  },
} satisfies Content;
