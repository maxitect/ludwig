import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/chess-problem/schema";

export const meta = {
  slug: "the-corner-office",
  title: "The Corner Office",
  difficulty: 3,
  sourceNote: "Original position by the Ludwig authors.",
  publishedAt: new Date("2026-10-20T00:00:00Z"),
} satisfies ContentMeta;

// A: Qg7. B: Kh4. C: Qh6# or Qg4#, either mates.
export const content = {
  mateIn: 2,
  fen: "3N4/8/8/7k/8/5K2/8/Q7 w - - 0 1",
} satisfies ContentFile;
