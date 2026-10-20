import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/chess-problem/schema";

export const meta = {
  slug: "the-king-steps-in",
  title: "The King Steps In",
  difficulty: 4,
  sourceNote: "Original position by the Ludwig authors.",
  publishedAt: new Date("2026-10-20T00:00:00Z"),
} satisfies ContentMeta;

// A: Kc7. Black's pawn push b5 changes nothing. C: Ra1#.
export const content = {
  mateIn: 2,
  fen: "k7/1p6/2K4n/6Rp/4p3/8/8/6R1 w - - 0 1",
} satisfies ContentFile;
