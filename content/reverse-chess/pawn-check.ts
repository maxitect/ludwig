import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "pawn-check",
  title: "Pawn Check",
  difficulty: 1,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnbqkbnr/pppp1p2/7p/6p1/7P/4pPPN/PPPPPK2/RNBQ1B1R w kq - 0 6
 * Proof game: h4 g5 f3 e5 g3 h6 Nh3 e4 Kf2 e3+
 */
export const content = {
  mode: "last_move",
  sideToMove: "white",
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: true,
  blackQueenside: true,
  halfmove: 0,
  fullmove: 6,
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 8, colour: "black", piece: "knight" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "d", rank: 8, colour: "black", piece: "queen" },
    { file: "e", rank: 8, colour: "black", piece: "king" },
    { file: "f", rank: 8, colour: "black", piece: "bishop" },
    { file: "g", rank: 8, colour: "black", piece: "knight" },
    { file: "h", rank: 8, colour: "black", piece: "rook" },
    { file: "a", rank: 7, colour: "black", piece: "pawn" },
    { file: "b", rank: 7, colour: "black", piece: "pawn" },
    { file: "c", rank: 7, colour: "black", piece: "pawn" },
    { file: "d", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "black", piece: "pawn" },
    { file: "h", rank: 6, colour: "black", piece: "pawn" },
    { file: "g", rank: 5, colour: "black", piece: "pawn" },
    { file: "h", rank: 4, colour: "white", piece: "pawn" },
    { file: "e", rank: 3, colour: "black", piece: "pawn" },
    { file: "f", rank: 3, colour: "white", piece: "pawn" },
    { file: "g", rank: 3, colour: "white", piece: "pawn" },
    { file: "h", rank: 3, colour: "white", piece: "knight" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "b", rank: 2, colour: "white", piece: "pawn" },
    { file: "c", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "white", piece: "pawn" },
    { file: "e", rank: 2, colour: "white", piece: "pawn" },
    { file: "f", rank: 2, colour: "white", piece: "king" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "b", rank: 1, colour: "white", piece: "knight" },
    { file: "c", rank: 1, colour: "white", piece: "bishop" },
    { file: "d", rank: 1, colour: "white", piece: "queen" },
    { file: "f", rank: 1, colour: "white", piece: "bishop" },
    { file: "h", rank: 1, colour: "white", piece: "rook" },
  ],
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
} satisfies Content;
