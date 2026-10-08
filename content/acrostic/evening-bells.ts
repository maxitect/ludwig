import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/acrostic/schema";

export const meta = {
  slug: "evening-bells",
  title: "Evening Bells",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rule: "first_letter_word",
  lines: ["Tonight heavy evening bells", "unsettled the lonely", "estate residents."],
} satisfies Content;
