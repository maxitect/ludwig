import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/chess-problem/schema";

export const meta = {
  slug: "no-way-out",
  title: "No Way Out",
  difficulty: 1,
  sourceNote: "Original position by the Ludwig authors.",
  publishedAt: new Date("2026-10-20T00:00:00Z"),
} satisfies ContentMeta;

// Nf7#: Black's own rook and pawns box the king in.
export const content = {
  mateIn: 1,
  fen: "6rk/6pp/8/6N1/8/8/8/4K3 w - - 0 1",
} satisfies ContentFile;
