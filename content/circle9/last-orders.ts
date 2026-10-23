import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "last-orders",
  title: "Last Orders",
  difficulty: 5,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "7.7356722", "5.92.7.3.", "3.7.51651", "37....751", "2411...29", "1..8.....", "23...3.49", ".77..8..1", "1..7329.8",
  ],
} satisfies Content;

export const generated = { generator: "circle9", version: 1, seed: "last-orders" } satisfies Provenance;
