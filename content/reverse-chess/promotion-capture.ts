import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "promotion-capture",
  title: "Promotion by Capture",
  difficulty: 4,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: e4 b5 f4 e6 f5 exf5 e5 Ne7 e6 Ng8 e7 b4 b3 h6 Bd3 h5 exd8=R+
export const content = {
  mode: "last_move",
  fen: "rnbRkbnr/p1pp1pp1/8/5p1p/1p6/1P1B4/P1PP2PP/RNBQK1NR b KQkq - 0 9",
  solutionPlies: [
    {
      fromFile: "e",
      fromRank: 7,
      toFile: "d",
      toRank: 8,
      uncapture: "queen",
      unpromote: true,
      special: "none",
    },
  ],
} satisfies ContentFile;
