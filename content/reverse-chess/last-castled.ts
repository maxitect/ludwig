import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "last-castled",
  title: "Last Castled",
  difficulty: 4,
  sourceNote: "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

/**
 * rnbqk2r/ppppppbp/6p1/8/8/5NPP/PPPPPPBn/RNBQ1RK1 w kq - 3 6
 * Proof game: Nf3 Nf6 g3 g6 Bg2 Bg7 h3 Ng4 O-O Nh2
 */
export const content = {
  mode: "unwind",
  sideToMove: "white",
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: true,
  blackQueenside: true,
  halfmove: 3,
  fullmove: 6,
  goal: {
    kind: "castling_right",
    displayText: "The moment White last castled",
    colour: "white",
    side: "kingside"
  },
  pieces: [
    {
      file: "a",
      rank: 8,
      colour: "black",
      piece: "rook"
    },
    {
      file: "b",
      rank: 8,
      colour: "black",
      piece: "knight"
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
      file: "e",
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
      piece: "bishop"
    },
    {
      file: "h",
      rank: 7,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "g",
      rank: 6,
      colour: "black",
      piece: "pawn"
    },
    {
      file: "f",
      rank: 3,
      colour: "white",
      piece: "knight"
    },
    {
      file: "g",
      rank: 3,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "h",
      rank: 3,
      colour: "white",
      piece: "pawn"
    },
    {
      file: "a",
      rank: 2,
      colour: "white",
      piece: "pawn"
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
      file: "d",
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
      piece: "bishop"
    },
    {
      file: "h",
      rank: 2,
      colour: "black",
      piece: "knight"
    },
    {
      file: "a",
      rank: 1,
      colour: "white",
      piece: "rook"
    },
    {
      file: "b",
      rank: 1,
      colour: "white",
      piece: "knight"
    },
    {
      file: "c",
      rank: 1,
      colour: "white",
      piece: "bishop"
    },
    {
      file: "d",
      rank: 1,
      colour: "white",
      piece: "queen"
    },
    {
      file: "f",
      rank: 1,
      colour: "white",
      piece: "rook"
    },
    {
      file: "g",
      rank: 1,
      colour: "white",
      piece: "king"
    }
  ],
  solutionPlies: [
    {
      fromFile: "g",
      fromRank: 4,
      toFile: "h",
      toRank: 2,
      unpromote: false,
      special: "none"
    },
    {
      fromFile: "e",
      fromRank: 1,
      toFile: "g",
      toRank: 1,
      unpromote: false,
      special: "castle"
    }
  ]
} satisfies Content;
