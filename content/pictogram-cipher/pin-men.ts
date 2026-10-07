import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/pictogram-cipher/schema";

export const meta = {
  slug: "pin-men",
  title: "Pin Men",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "wait for the whistle behind the old mill",
  given: ["w", "a", "t", "h", "o", "f", "e"],
} satisfies Content;
