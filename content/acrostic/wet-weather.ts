import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/acrostic/schema";

export const meta = {
  slug: "wet-weather",
  title: "Wet Weather",
  difficulty: 1,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rule: "first_letter_line",
  lines: [
    "Can you hear the rain on the roof tonight?",
    "Old houses talk when the weather turns.",
    "Mum kept the porch light on again.",
    "Every window here still faces the road.",
    "Half the village has asked after you.",
    "Outside, the garden has gone wild without you.",
    "Maybe you will read this by the sea.",
    "Either way, the kettle is always on.",
  ],
} satisfies Content;
