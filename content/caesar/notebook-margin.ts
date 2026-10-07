import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/caesar/schema";

export const meta = {
  slug: "notebook-margin",
  title: "Notebook Margin",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "the answer is written in the margin of the page",
  shift: 3,
} satisfies Content;
