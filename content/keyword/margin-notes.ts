import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/keyword/schema";

export const meta = {
  slug: "margin-notes",
  title: "Margin Notes",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "nobody reads the last page of a borrowed book",
  keyword: "quiver",
} satisfies Content;
