import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/odd-one-out/schema";

export const meta = {
  slug: "number-crunch",
  title: "Number Crunch",
  difficulty: 2,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  reviewNote:
    "1, 8, 27 and 64 are 1, 2, 3 and 4 multiplied by themselves twice; 100 is not a cube. Squares do not work as the rule: 1, 64 and 100 are squares but 8 and 27 are not, which leaves two items out. Parity does not work either (27 and 1 are odd, 8, 64 and 100 even). Only the cube rule leaves exactly one item out.",
} satisfies ContentMeta;

export const content = {
  promptText: "Four of these numbers share a property. Which is the odd one out?",
  items: ["27", "100", "8", "64", "1"],
  solution: {
    itemPosition: 1,
    explanation:
      "1, 8, 27 and 64 are the cubes of 1, 2, 3 and 4. A hundred is a square, but no whole number multiplied by itself twice makes it.",
  },
} satisfies Content;
