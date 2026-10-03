import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "dev-pawn-push",
  title: "Dev: Pawn Push",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  mode: "last_move",
  sideToMove: "black",
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: false,
  blackQueenside: false,
  halfmove: 0,
  fullmove: 1,
  pieces: [
    { file: "b", rank: 7, colour: "black", piece: "king" },
    { file: "a", rank: 6, colour: "white", piece: "pawn" },
    { file: "b", rank: 5, colour: "black", piece: "pawn" },
    { file: "b", rank: 4, colour: "white", piece: "bishop" },
    { file: "h", rank: 3, colour: "white", piece: "king" },
    { file: "b", rank: 2, colour: "white", piece: "pawn" },
  ],
  solutionPlies: [
    {
      fromFile: "a",
      fromRank: 5,
      toFile: "a",
      toRank: 6,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies Content;
