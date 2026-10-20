import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "knight-trade",
  title: "Knight Trade",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: Nh3 a6 c3 Nf6 Ng5 Rg8 Nxh7 Nxh7
export const content = {
  mode: "unwind",
  goal: {
    kind: "piece_count",
    displayText: "Before Black lost a pawn: Black has all eight again",
    colour: "black",
    piece: "pawn",
    count: 8,
  },
  fen: "rnbqkbr1/1ppppppn/p7/8/8/2P5/PP1PPPPP/RNBQKB1R w KQq - 0 5",
  solutionPlies: [
    {
      fromFile: "f",
      fromRank: 6,
      toFile: "h",
      toRank: 7,
      uncapture: "knight",
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "g",
      fromRank: 5,
      toFile: "h",
      toRank: 7,
      uncapture: "pawn",
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
