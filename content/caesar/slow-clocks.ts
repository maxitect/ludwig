import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/caesar/schema";

export const meta = {
  slug: "slow-clocks",
  title: "Slow Clocks",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "every clock in the house is five minutes slow",
  shift: 9,
} satisfies Content;
