import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/caesar/schema";

export const meta = {
  slug: "lamp-oil",
  title: "Lamp Oil",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "burn the letters but keep the ashes in a tin",
  shift: 14,
} satisfies Content;
