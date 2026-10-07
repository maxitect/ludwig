import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/pictogram-cipher/schema";

export const meta = {
  slug: "first-drawing",
  title: "First Drawing",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "paper boats cannot cross the river twice",
  given: ["e", "t", "o", "a", "r"],
} satisfies Content;
