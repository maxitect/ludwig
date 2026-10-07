import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/keyword/schema";

export const meta = {
  slug: "pencil-stub",
  title: "Pencil Stub",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  plaintext: "count the steps from the gate to the old apple tree",
  keyword: "jasmine",
} satisfies Content;
