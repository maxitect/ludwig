import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/caesar/schema";

export const meta = {
  slug: "last-train",
  title: "Last Train",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "meet me at the station before the last train leaves",
  shift: 5,
} satisfies Content;
