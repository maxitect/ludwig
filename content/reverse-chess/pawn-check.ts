import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "pawn-check",
  title: "Pawn Check",
  difficulty: 1,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: h4 g5 f3 e5 g3 h6 Nh3 e4 Kf2 e3+
export const content = {
  mode: "last_move",
  fen: "rnbqkbnr/pppp1p2/7p/6p1/7P/4pPPN/PPPPPK2/RNBQ1B1R w kq - 0 6",
  solutionPlies: [
    {
      fromFile: "e",
      fromRank: 4,
      toFile: "e",
      toRank: 3,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
