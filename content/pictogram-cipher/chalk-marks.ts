import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/pictogram-cipher/schema";

export const meta = {
  slug: "chalk-marks",
  title: "Chalk Marks",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "every letter was burned except the last",
  given: ["e", "t", "a", "r", "b", "u", "x"],
} satisfies Content;
