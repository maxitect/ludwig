import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/pictogram-cipher/schema";

export const meta = {
  slug: "margin-doodle",
  title: "Margin Doodle",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "the third step creaks when someone lies",
  given: ["e", "t", "h", "c", "o", "s", "n"],
} satisfies Content;
