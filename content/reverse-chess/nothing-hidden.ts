import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "nothing-hidden",
  title: "Nothing Hidden",
  difficulty: 5,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnb2bnr/1pp5/p3kppp/1q1ppP2/2PPN1PP/1P2B2R/P3P3/RN1QKB2 b Q - 0 12
 * Proof game: b3 e6 d4 d5 f4 h6 Nh3 Qd7 g4 g6 c4 Ke7 Ng5 a6 Ne4 e5 h4 Ke6 Rh3 Qb5 Be3 f6 f5+
 */
export const content = {
  mode: "last_move",
  sideToMove: "black",
  whiteKingside: false,
  whiteQueenside: true,
  blackKingside: false,
  blackQueenside: false,
  halfmove: 0,
  fullmove: 12,
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 8, colour: "black", piece: "knight" },
    { file: "c", rank: 8, colour: "black", piece: "bishop" },
    { file: "f", rank: 8, colour: "black", piece: "bishop" },
    { file: "g", rank: 8, colour: "black", piece: "knight" },
    { file: "h", rank: 8, colour: "black", piece: "rook" },
    { file: "b", rank: 7, colour: "black", piece: "pawn" },
    { file: "c", rank: 7, colour: "black", piece: "pawn" },
    { file: "a", rank: 6, colour: "black", piece: "pawn" },
    { file: "e", rank: 6, colour: "black", piece: "king" },
    { file: "f", rank: 6, colour: "black", piece: "pawn" },
    { file: "g", rank: 6, colour: "black", piece: "pawn" },
    { file: "h", rank: 6, colour: "black", piece: "pawn" },
    { file: "b", rank: 5, colour: "black", piece: "queen" },
    { file: "d", rank: 5, colour: "black", piece: "pawn" },
    { file: "e", rank: 5, colour: "black", piece: "pawn" },
    { file: "f", rank: 5, colour: "white", piece: "pawn" },
    { file: "c", rank: 4, colour: "white", piece: "pawn" },
    { file: "d", rank: 4, colour: "white", piece: "pawn" },
    { file: "e", rank: 4, colour: "white", piece: "knight" },
    { file: "g", rank: 4, colour: "white", piece: "pawn" },
    { file: "h", rank: 4, colour: "white", piece: "pawn" },
    { file: "b", rank: 3, colour: "white", piece: "pawn" },
    { file: "e", rank: 3, colour: "white", piece: "bishop" },
    { file: "h", rank: 3, colour: "white", piece: "rook" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "e", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "b", rank: 1, colour: "white", piece: "knight" },
    { file: "d", rank: 1, colour: "white", piece: "queen" },
    { file: "e", rank: 1, colour: "white", piece: "king" },
    { file: "f", rank: 1, colour: "white", piece: "bishop" },
  ],
  solutionPlies: [
    {
      fromFile: "f",
      fromRank: 4,
      toFile: "f",
      toRank: 5,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies Content;
