import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/pictogram-cipher/schema";

export const meta = {
  slug: "scribble-pad",
  title: "Scribble Pad",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "nobody ever checks the empty chair",
  given: ["n", "o", "b", "e", "c", "k", "h"],
} satisfies Content;
