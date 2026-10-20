import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "false-trail",
  title: "False Trail",
  difficulty: 3,
  publishedAt: new Date("2026-10-15T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "..4..4.7.",
    "7867...86",
    "...31....",
    "..25..77.",
    "45.536..9",
    ".3......7",
    "83...6.4.",
    "...5..252",
    "3..939..5",
  ],
} satisfies Content;
