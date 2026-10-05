import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "knight-trade",
  title: "Knight Trade",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnbqkbr1/1ppppppn/p7/8/8/2P5/PP1PPPPP/RNBQKB1R w KQq - 0 5
 * Proof game: Nh3 a6 c3 Nf6 Ng5 Rg8 Nxh7 Nxh7
 */
export const content = {
  mode: "unwind",
  sideToMove: "white",
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: false,
  blackQueenside: true,
  halfmove: 0,
  fullmove: 5,
  goal: {
    kind: "piece_count",
    displayText: "Before Black lost a pawn: Black has all eight again",
    colour: "black",
    piece: "pawn",
    count: 8,
  },
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 8, colour: "black", piece: "knight" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "d", rank: 8, colour: "black", piece: "queen" },
    { file: "e", rank: 8, colour: "black", piece: "king" },
    { file: "f", rank: 8, colour: "black", piece: "bishop" },
    { file: "g", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 7, colour: "black", piece: "pawn" },
    { file: "c", rank: 7, colour: "black", piece: "pawn" },
    { file: "d", rank: 7, colour: "black", piece: "pawn" },
    { file: "e", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "black", piece: "pawn" },
    { file: "g", rank: 7, colour: "black", piece: "pawn" },
    { file: "h", rank: 7, colour: "black", piece: "knight" },
    { file: "a", rank: 6, colour: "black", piece: "pawn" },
    { file: "c", rank: 3, colour: "white", piece: "pawn" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "b", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "white", piece: "pawn" },
    { file: "e", rank: 2, colour: "white", piece: "pawn" },
    { file: "f", rank: 2, colour: "white", piece: "pawn" },
    { file: "g", rank: 2, colour: "white", piece: "pawn" },
    { file: "h", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "b", rank: 1, colour: "white", piece: "knight" },
    { file: "c", rank: 1, colour: "white", piece: "bishop" },
    { file: "d", rank: 1, colour: "white", piece: "queen" },
    { file: "e", rank: 1, colour: "white", piece: "king" },
    { file: "f", rank: 1, colour: "white", piece: "bishop" },
    { file: "h", rank: 1, colour: "white", piece: "rook" },
  ],
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
} satisfies Content;
