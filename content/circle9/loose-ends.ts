import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "loose-ends",
  title: "Loose Ends",
  difficulty: 1,
  publishedAt: new Date("2026-10-13T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    ".93...5.7",
    "8..2..8..",
    "...7.....",
    "15.......",
    ".....1..6",
    ".6..4..5.",
    "4....27..",
    ".96......",
    "...8.4.51",
  ],
} satisfies Content;
