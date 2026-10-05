import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "bishop-taken",
  title: "Bishop Taken",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnbqkb1r/p1pp1ppp/7n/1p3P2/7P/N1PP4/PP1pP1P1/R2QKBNR w KQkq - 0 10
 * Proof game: Nh3 Na6 Ng1 Nh6 c3 e5 f4 e4 d3 b6 Na3 e3 h4 Nb8 Bd2 b5 f5 exd2+
 */
export const content = {
  mode: "last_move",
  sideToMove: "white",
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true,
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
    { file: "c", rank: 7, colour: "black", piece: "pawn" },
    { file: "d", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "black", piece: "pawn" },
    { file: "g", rank: 7, colour: "black", piece: "pawn" },
    { file: "h", rank: 7, colour: "black", piece: "pawn" },
    { file: "h", rank: 6, colour: "black", piece: "knight" },
    { file: "b", rank: 5, colour: "black", piece: "pawn" },
    { file: "f", rank: 5, colour: "white", piece: "pawn" },
    { file: "h", rank: 4, colour: "white", piece: "pawn" },
    { file: "a", rank: 3, colour: "white", piece: "knight" },
    { file: "c", rank: 3, colour: "white", piece: "pawn" },
    { file: "d", rank: 3, colour: "white", piece: "pawn" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "b", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "black", piece: "pawn" },
    { file: "e", rank: 2, colour: "white", piece: "pawn" },
    { file: "g", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
    { file: "d", rank: 1, colour: "white", piece: "queen" },
    { file: "e", rank: 1, colour: "white", piece: "king" },
    { file: "f", rank: 1, colour: "white", piece: "bishop" },
    { file: "g", rank: 1, colour: "white", piece: "knight" },
    { file: "h", rank: 1, colour: "white", piece: "rook" },
  ],
  solutionPlies: [
    {
      fromFile: "e",
      fromRank: 3,
      toFile: "d",
      toRank: 2,
      uncapture: "bishop",
      unpromote: false,
      special: "none",
    },
  ],
} satisfies Content;
