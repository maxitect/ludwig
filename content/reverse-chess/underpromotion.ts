import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "underpromotion",
  title: "Underpromotion",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: c4 e6 c5 Bxc5 e3 b6 e4 a6 e5 f6 exf6 b5 f7+ Ke7 f8=B+
export const content = {
  mode: "last_move",
  fen: "rnbq1Bnr/2ppk1pp/p3p3/1pb5/8/8/PP1P1PPP/RNBQKBNR b KQ - 0 8",
  solutionPlies: [
    {
      fromFile: "f",
      fromRank: 7,
      toFile: "f",
      toRank: 8,
      unpromote: true,
      special: "none",
    },
  ],
} satisfies ContentFile;
