import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "promotion-capture",
  title: "Promotion by Capture",
  difficulty: 4,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnbRkbnr/p1pp1pp1/8/5p1p/1p6/1P1B4/P1PP2PP/RNBQK1NR b KQkq - 0 9
 * Proof game: e4 b5 f4 e6 f5 exf5 e5 Ne7 e6 Ng8 e7 b4 b3 h6 Bd3 h5 exd8=R+
 */
export const content = {
  mode: "last_move",
  sideToMove: "black",
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true,
  halfmove: 0,
  fullmove: 9,
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 8, colour: "black", piece: "knight" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "d", rank: 8, colour: "white", piece: "rook" },
    { file: "e", rank: 8, colour: "black", piece: "king" },
    { file: "f", rank: 8, colour: "black", piece: "bishop" },
    { file: "g", rank: 8, colour: "black", piece: "knight" },
    { file: "h", rank: 8, colour: "black", piece: "rook" },
    { file: "a", rank: 7, colour: "black", piece: "pawn" },
    { file: "c", rank: 7, colour: "black", piece: "pawn" },
    { file: "d", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "black", piece: "pawn" },
    { file: "g", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 5, colour: "black", piece: "pawn" },
    { file: "h", rank: 5, colour: "black", piece: "pawn" },
    { file: "b", rank: 4, colour: "black", piece: "pawn" },
    { file: "b", rank: 3, colour: "white", piece: "pawn" },
    { file: "d", rank: 3, colour: "white", piece: "bishop" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "c", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "white", piece: "pawn" },
    { file: "g", rank: 2, colour: "white", piece: "pawn" },
    { file: "h", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "b", rank: 1, colour: "white", piece: "knight" },
    { file: "c", rank: 1, colour: "white", piece: "bishop" },
    { file: "d", rank: 1, colour: "white", piece: "queen" },
    { file: "e", rank: 1, colour: "white", piece: "king" },
    { file: "g", rank: 1, colour: "white", piece: "knight" },
    { file: "h", rank: 1, colour: "white", piece: "rook" },
  ],
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
} satisfies Content;
