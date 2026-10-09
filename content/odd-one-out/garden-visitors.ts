import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/odd-one-out/schema";

export const meta = {
  slug: "garden-visitors",
  title: "Garden Visitors",
  difficulty: 3,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  reviewNote:
    "Magpie, jackdaw, crow and raven are all corvids, members of the crow family. The robin is a chat of the thrush family. No other split leaves one item out: all five are British birds that can be seen in a garden, and size or colour does not separate the robin alone (the jackdaw is also small and grey).",
} satisfies ContentMeta;

export const content = {
  promptText: "Four of these birds are related. Which is the odd one out?",
  items: ["Magpie", "Robin", "Jackdaw", "Crow", "Raven"],
  solution: {
    itemPosition: 1,
    explanation:
      "Magpies, jackdaws, crows and ravens all belong to the crow family. The robin is a small chat, a relative of the thrushes.",
  },
} satisfies Content;
