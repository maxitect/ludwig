import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "pencil-case",
  title: "Pencil Case",
  difficulty: 4,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "26..1..8.",
    "674..6356",
    ".73...5.5",
    "31.......",
    ".7...9459",
    ".3.5.4224",
    ".5.625...",
    "7.8.8.2.7",
    "28..698..",
  ],
} satisfies Content;
