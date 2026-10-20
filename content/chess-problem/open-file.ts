import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/chess-problem/schema";

export const meta = {
  slug: "open-file",
  title: "The Open File",
  difficulty: 1,
  sourceNote: "Original position by the Ludwig authors.",
  publishedAt: new Date("2026-10-20T00:00:00Z"),
} satisfies ContentMeta;

// Rxd8#: the pawns at home leave the king no flight square.
export const content = {
  mateIn: 1,
  fen: "3r2k1/5ppp/8/8/8/8/1Q6/3RK3 w - - 0 1",
} satisfies ContentFile;
