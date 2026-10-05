import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "underpromotion",
  title: "Underpromotion",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnbq1Bnr/2ppk1pp/p3p3/1pb5/8/8/PP1P1PPP/RNBQKBNR b KQ - 0 8
 * Proof game: c4 e6 c5 Bxc5 e3 b6 e4 a6 e5 f6 exf6 b5 f7+ Ke7 f8=B+
 */
export const content = {
  mode: "last_move",
  sideToMove: "black",
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: false,
  blackQueenside: false,
  halfmove: 0,
  fullmove: 8,
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 8, colour: "black", piece: "knight" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "d", rank: 8, colour: "black", piece: "queen" },
    { file: "f", rank: 8, colour: "white", piece: "bishop" },
    { file: "g", rank: 8, colour: "black", piece: "knight" },
    { file: "h", rank: 8, colour: "black", piece: "rook" },
    { file: "c", rank: 7, colour: "black", piece: "pawn" },
    { file: "d", rank: 7, colour: "black", piece: "pawn" },
    { file: "e", rank: 7, colour: "black", piece: "king" },
    { file: "g", rank: 7, colour: "black", piece: "pawn" },
    { file: "h", rank: 7, colour: "black", piece: "pawn" },
    { file: "a", rank: 6, colour: "black", piece: "pawn" },
    { file: "e", rank: 6, colour: "black", piece: "pawn" },
    { file: "b", rank: 5, colour: "black", piece: "pawn" },
    { file: "c", rank: 5, colour: "black", piece: "bishop" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "b", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "white", piece: "pawn" },
    { file: "f", rank: 2, colour: "white", piece: "pawn" },
    { file: "g", rank: 2, colour: "white", piece: "pawn" },
    { file: "h", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "b", rank: 1, colour: "white", piece: "knight" },
    { file: "c", rank: 1, colour: "white", piece: "bishop" },
    { file: "d", rank: 1, colour: "white", piece: "queen" },
    { file: "e", rank: 1, colour: "white", piece: "king" },
    { file: "f", rank: 1, colour: "white", piece: "bishop" },
    { file: "g", rank: 1, colour: "white", piece: "knight" },
    { file: "h", rank: 1, colour: "white", piece: "rook" },
  ],
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
} satisfies Content;
