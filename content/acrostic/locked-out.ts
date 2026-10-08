import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/acrostic/schema";

export const meta = {
  slug: "locked-out",
  title: "Locked Out",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rule: "first_letter_word",
  lines: ["Meet inside Dad's newsagent.", "If Gran hears, tiptoe."],
} satisfies Content;
