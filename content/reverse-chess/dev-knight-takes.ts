import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "dev-knight-takes",
  title: "Dev: Knight Takes",
  difficulty: 2,
} satisfies ContentMeta;

/**
 * rnbqkb1r/pppppPpp/5pN1/8/8/8/PPPP1PPP/RNBQKB1R b - - 0 10
 * Proof game: 1.e3 f6 2.e4 Kf7 3.e5 Ke8 4.e6 Nh6 5.Nf3 Rg8 6.Nh4 Rh8 7.Ng6 Nc6 8.Ke2 Nb8 9.Ke1 Nf7 10.exf7+
 */
export const content = {
  mode: "last_move",
  sideToMove: "black",
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: false,
  blackQueenside: false,
  halfmove: 0,
  fullmove: 10,
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 8, colour: "black", piece: "knight" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "d", rank: 8, colour: "black", piece: "queen" },
    { file: "e", rank: 8, colour: "black", piece: "king" },
    { file: "f", rank: 8, colour: "black", piece: "bishop" },
    { file: "h", rank: 8, colour: "black", piece: "rook" },
    { file: "a", rank: 7, colour: "black", piece: "pawn" },
    { file: "b", rank: 7, colour: "black", piece: "pawn" },
    { file: "c", rank: 7, colour: "black", piece: "pawn" },
    { file: "d", rank: 7, colour: "black", piece: "pawn" },
    { file: "e", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "white", piece: "pawn" },
    { file: "g", rank: 7, colour: "black", piece: "pawn" },
    { file: "h", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 6, colour: "black", piece: "pawn" },
    { file: "g", rank: 6, colour: "white", piece: "knight" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
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
    { file: "f", rank: 1, colour: "white", piece: "bishop" },
    { file: "h", rank: 1, colour: "white", piece: "rook" },
  ],
  solutionPlies: [
    {
      fromFile: "e",
      fromRank: 6,
      toFile: "f",
      toRank: 7,
      uncapture: "knight",
      unpromote: false,
      special: "none",
    },
  ],
} satisfies Content;
