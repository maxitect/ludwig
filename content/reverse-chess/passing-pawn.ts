import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "passing-pawn",
  title: "Passing Pawn",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnbq1bnr/1p2pkp1/p2P3p/2p2p2/P1B5/7N/1PPP1PPP/RNBQK2R b KQ - 0 7
 * Proof game: e4 c5 Bb5 h6 Nh3 f5 e5 a6 a4 Kf7 Bc4+ d5 exd6+
 */
export const content = {
  mode: "unwind",
  sideToMove: "black",
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: false,
  blackQueenside: false,
  halfmove: 0,
  fullmove: 7,
  goal: {
    kind: "piece_on_square",
    displayText: "Before Black pushed the d-pawn two squares",
    colour: "black",
    piece: "pawn",
    file: "d",
    rank: 7,
  },
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 8, colour: "black", piece: "knight" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "d", rank: 8, colour: "black", piece: "queen" },
    { file: "f", rank: 8, colour: "black", piece: "bishop" },
    { file: "g", rank: 8, colour: "black", piece: "knight" },
    { file: "h", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 7, colour: "black", piece: "pawn" },
    { file: "e", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "black", piece: "king" },
    { file: "g", rank: 7, colour: "black", piece: "pawn" },
    { file: "a", rank: 6, colour: "black", piece: "pawn" },
    { file: "d", rank: 6, colour: "white", piece: "pawn" },
    { file: "h", rank: 6, colour: "black", piece: "pawn" },
    { file: "c", rank: 5, colour: "black", piece: "pawn" },
    { file: "f", rank: 5, colour: "black", piece: "pawn" },
    { file: "a", rank: 4, colour: "white", piece: "pawn" },
    { file: "c", rank: 4, colour: "white", piece: "bishop" },
    { file: "h", rank: 3, colour: "white", piece: "knight" },
    { file: "b", rank: 2, colour: "white", piece: "pawn" },
    { file: "c", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "white", piece: "pawn" },
    { file: "f", rank: 2, colour: "white", piece: "pawn" },
    { file: "g", rank: 2, colour: "white", piece: "pawn" },
    { file: "h", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "b", rank: 1, colour: "white", piece: "knight" },
    { file: "c", rank: 1, colour: "white", piece: "bishop" },
    { file: "d", rank: 1, colour: "white", piece: "queen" },
    { file: "e", rank: 1, colour: "white", piece: "king" },
    { file: "h", rank: 1, colour: "white", piece: "rook" },
  ],
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
} satisfies Content;
