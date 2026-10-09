import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/odd-one-out/schema";

export const meta = {
  slug: "pit-orchestra",
  title: "Pit Orchestra",
  difficulty: 1,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  reviewNote:
    "Violin, cello, viola and harp all make their sound with strings; the trumpet is the only brass instrument. Splitting by how the strings are played (bowed against plucked) leaves two items on one side, the harp and the trumpet, so it cannot be the rule. No other property singles out one item.",
} satisfies ContentMeta;

export const content = {
  promptText: "Four of these belong together. Which is the odd one out?",
  items: ["Violin", "Cello", "Trumpet", "Harp", "Viola"],
  solution: {
    itemPosition: 2,
    explanation:
      "The violin, cello, harp and viola all sound from vibrating strings. The trumpet is a brass instrument, played by buzzing the lips.",
  },
} satisfies Content;
