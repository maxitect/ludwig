import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "dev-unwind",
  title: "Dev: Unwind",
  difficulty: 1,
} satisfies ContentMeta;

export const content = {
  mode: "unwind",
  sideToMove: "black",
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: false,
  blackQueenside: false,
  halfmove: 0,
  fullmove: 1,
  goal: {
    kind: "piece_on_square",
    displayText: "Before the black pawn left the a7 square",
    colour: "black",
    piece: "pawn",
    file: "a",
    rank: 7,
  },
  pieces: [
    { file: "a", rank: 1, colour: "white", piece: "king" },
    { file: "b", rank: 1, colour: "white", piece: "knight" },
    { file: "a", rank: 2, colour: "white", piece: "pawn" },
    { file: "b", rank: 2, colour: "white", piece: "pawn" },
    { file: "c", rank: 2, colour: "white", piece: "pawn" },
    { file: "d", rank: 2, colour: "white", piece: "pawn" },
    { file: "g", rank: 2, colour: "white", piece: "pawn" },
    { file: "a", rank: 3, colour: "white", piece: "pawn" },
    { file: "c", rank: 3, colour: "white", piece: "pawn" },
    { file: "h", rank: 3, colour: "white", piece: "pawn" },
    { file: "g", rank: 8, colour: "white", piece: "knight" },
    { file: "h", rank: 8, colour: "black", piece: "king" },
    { file: "b", rank: 7, colour: "black", piece: "pawn" },
    { file: "e", rank: 7, colour: "black", piece: "pawn" },
    { file: "f", rank: 7, colour: "black", piece: "pawn" },
    { file: "g", rank: 7, colour: "black", piece: "pawn" },
    { file: "h", rank: 7, colour: "black", piece: "pawn" },
    { file: "a", rank: 6, colour: "black", piece: "pawn" },
    { file: "f", rank: 6, colour: "black", piece: "pawn" },
    { file: "h", rank: 6, colour: "black", piece: "pawn" },
  ],
  solutionPlies: [
    {
      fromFile: "h",
      fromRank: 2,
      toFile: "h",
      toRank: 3,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "a",
      fromRank: 7,
      toFile: "a",
      toRank: 6,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies Content;
