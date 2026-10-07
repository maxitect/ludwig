import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/caesar/schema";

export const meta = {
  slug: "open-door",
  title: "Open Door",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "the door was never locked because nothing inside mattered",
  shift: 21,
} satisfies Content;
