import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "seventh-heaven",
  title: "Seventh Heaven",
  difficulty: 4,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * r1bqkbnr/4pp2/pp3np1/2p4p/4PQ2/1PN1B3/P1PpBPPP/R3KR2 w Qkq - 0 13
 * Proof game: Nf3 g6 Ne5 d5 Nc4 h6 Nc3 Nd7 d3 b6 b3 dxc4 e4 Ndf6 Qd2 c5 Be2 a6 Rf1 h5 Qf4 cxd3 Be3 d2+
 */
export const content = {
  mode: "last_move",
  sideToMove: "white",
  whiteKingside: false,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true,
  halfmove: 0,
  fullmove: 13,
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "d", rank: 8, colour: "black", piece: "queen" },
    { file: "e", rank: 8, colour: "black", piece: "king" },
    { file: "f", rank: 8, colour: "black", piece: "bishop" },
    { file: "g", rank: 8, colour: "black", piece: "knight" },
    { file: "h", rank: 8, colour: "black", piece: "rook" },
    { file: "e", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "black", piece: "pawn" },
    { file: "a", rank: 6, colour: "black", piece: "pawn" },
    { file: "b", rank: 6, colour: "black", piece: "pawn" },
    { file: "f", rank: 6, colour: "black", piece: "knight" },
    { file: "g", rank: 6, colour: "black", piece: "pawn" },
    { file: "c", rank: 5, colour: "black", piece: "pawn" },
    { file: "h", rank: 5, colour: "black", piece: "pawn" },
    { file: "e", rank: 4, colour: "white", piece: "pawn" },
    { file: "f", rank: 4, colour: "white", piece: "queen" },
    { file: "b", rank: 3, colour: "white", piece: "pawn" },
    { file: "c", rank: 3, colour: "white", piece: "knight" },
    { file: "e", rank: 3, colour: "white", piece: "bishop" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "c", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "black", piece: "pawn" },
    { file: "e", rank: 2, colour: "white", piece: "bishop" },
    { file: "f", rank: 2, colour: "white", piece: "pawn" },
    { file: "g", rank: 2, colour: "white", piece: "pawn" },
    { file: "h", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "e", rank: 1, colour: "white", piece: "king" },
    { file: "f", rank: 1, colour: "white", piece: "rook" },
  ],
  solutionPlies: [
    {
      fromFile: "d",
      fromRank: 3,
      toFile: "d",
      toRank: 2,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies Content;
