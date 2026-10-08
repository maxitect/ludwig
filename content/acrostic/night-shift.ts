import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/acrostic/schema";

export const meta = {
  slug: "night-shift",
  title: "Night Shift",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rule: "last_letter_line",
  lines: [
    "The stairwell light flickers on and then on again",
    "Somewhere below a dog barks at the studio",
    "I counted every door along the hall twice",
    "Nobody has touched the key inside the wooden box",
    "The fridge held nothing but a single kiwi",
    "Then I turned to go, and heard the clock strike eight",
  ],
} satisfies Content;
