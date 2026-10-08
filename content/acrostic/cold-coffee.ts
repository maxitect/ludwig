import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/acrostic/schema";

export const meta = {
  slug: "cold-coffee",
  title: "Cold Coffee",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rule: "first_letter_line",
  lines: [
    "In the end it was the small things that stayed with me.",
    "Last winter's bus stop, your scarf, the cold coffee.",
    "Once you laughed so hard the whole queue turned round.",
    "Very few people have made a Tuesday feel like that.",
    "Even now I replay it on the long walk back.",
    "You never noticed me keeping count of the days.",
    "Often I nearly said it, then lost my nerve.",
    "Until tonight, when I finally put it on paper.",
  ],
} satisfies Content;
