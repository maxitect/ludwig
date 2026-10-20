import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "full-circle",
  title: "Full Circle",
  difficulty: 5,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "3.22227.9",
    ".1..1.69.",
    ".6..24842",
    ".6..39575",
    ".754.6.88",
    "..799.241",
    "7...8....",
    "3.41..5.1",
    "3.12.26.6",
  ],
} satisfies Content;
