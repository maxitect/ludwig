import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/odd-one-out/schema";

export const meta = {
  slug: "concert-programme",
  title: "Concert Programme",
  difficulty: 2,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  reviewNote:
    "Bach, Brahms, Beethoven and Berlioz are four composers whose surnames start with B; Mozart's does not. Nationality does not split them cleanly (Bach, Brahms and Beethoven are German, Mozart Austrian, Berlioz French, so two items would be odd), and neither does era (Bach is Baroque, Mozart Classical, Beethoven between eras, Brahms and Berlioz Romantic).",
} satisfies ContentMeta;

export const content = {
  promptText: "Four of these composers share something. Which is the odd one out?",
  items: ["Bach", "Brahms", "Beethoven", "Berlioz", "Mozart"],
  solution: {
    itemPosition: 4,
    explanation:
      "Bach, Brahms, Beethoven and Berlioz all have surnames beginning with B. Mozart's begins with M.",
  },
} satisfies Content;
