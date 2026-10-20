import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "passing-pawn",
  title: "Passing Pawn",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: e4 c5 Bb5 h6 Nh3 f5 e5 a6 a4 Kf7 Bc4+ d5 exd6+
export const content = {
  mode: "unwind",
  goal: {
    kind: "piece_on_square",
    displayText: "Before Black pushed the d-pawn two squares",
    colour: "black",
    piece: "pawn",
    file: "d",
    rank: 7,
  },
  fen: "rnbq1bnr/1p2pkp1/p2P3p/2p2p2/P1B5/7N/1PPP1PPP/RNBQK2R b KQ - 0 7",
  solutionPlies: [
    {
      fromFile: "e",
      fromRank: 5,
      toFile: "d",
      toRank: 6,
      unpromote: false,
      special: "en_passant",
    },
    {
      fromFile: "d",
      fromRank: 7,
      toFile: "d",
      toRank: 5,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
