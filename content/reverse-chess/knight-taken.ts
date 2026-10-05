import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "knight-taken",
  title: "Knight Taken",
  difficulty: 2,
  sourceNote: "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * r1bqk1nr/pppp1ppp/4p3/n7/3P4/P1bQ3N/1PP1PPPP/R1B1KB1R w KQkq - 0 6
 * Proof game: a3 Nc6 d4 e6 Nc3 Na5 Qd3 Bb4 Nh3 Bxc3+
 */
export const content = {
  mode: "last_move",
  sideToMove: "white",
  whiteKingside: true,
  whiteQueenside: true,
  blackKingside: true,
  blackQueenside: true,
  halfmove: 0,
  fullmove: 6,
  pieces: [
    {
      file: "a",
      rank: 8,
      colour: "black",
      piece: "rook"
    },
    {
      file: "c",
      rank: 8,
      colour: "black",
      piece: "bishop"
    },
    {
      file: "d",
      rank: 8,
      colour: "black",
      piece: "queen"
    },
    {
      file: "e",
      rank: 8,
      colour: "black",
      piece: "king"
    },
    {
      file: "g",
      rank: 8,
      colour: "black",
      piece: "knight"
    },
    {
      file: "h",
      rank: 8,
      colour: "black",
      piece: "rook"
    },
    {
      file: "a",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "b",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "c",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "d",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "f",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "g",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "h",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "e",
      rank: 6,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "a",
      rank: 5,
      colour: "black",
      piece: "knight"
    },
    {
      file: "d",
      rank: 4,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "a",
      rank: 3,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "c",
      rank: 3,
      colour: "black",
      piece: "bishop"
    },
    {
      file: "d",
      rank: 3,
      colour: "white",
      piece: "queen"
    },
    {
      file: "h",
      rank: 3,
      colour: "white",
      piece: "knight"
    },
    {
      file: "b",
      rank: 2,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "c",
      rank: 2,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "e",
      rank: 2,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "f",
      rank: 2,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "g",
      rank: 2,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "h",
      rank: 2,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "a",
      rank: 1,
      colour: "white",
      piece: "rook"
    },
    {
      file: "c",
      rank: 1,
      colour: "white",
      piece: "bishop"
    },
    {
      file: "e",
      rank: 1,
      colour: "white",
      piece: "king"
    },
    {
      file: "f",
      rank: 1,
      colour: "white",
      piece: "bishop"
    },
    {
      file: "h",
      rank: 1,
      colour: "white",
      piece: "rook"
    }
  ],
  solutionPlies: [
    {
      fromFile: "b",
      fromRank: 4,
      toFile: "c",
      toRank: 3,
      uncapture: "knight",
      unpromote: false,
      special: "none"
    }
  ]
} satisfies Content;
