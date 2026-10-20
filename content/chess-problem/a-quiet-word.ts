import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/chess-problem/schema";

export const meta = {
  slug: "a-quiet-word",
  title: "A Quiet Word",
  difficulty: 3,
  sourceNote: "Original position by the Ludwig authors.",
  publishedAt: new Date("2026-10-20T00:00:00Z"),
} satisfies ContentMeta;

// A: Qc6. B: Ka7, though every reply allows the same mate. C: Qb7#.
export const content = {
  mateIn: 2,
  fen: "1k6/4p3/8/8/8/8/2Q5/2K4B w - - 0 1",
} satisfies ContentFile;
