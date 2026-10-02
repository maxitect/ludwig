import type { ContentMeta } from "../../../../../../scripts/content-files";
import type { Content } from "../../../schema";

export const meta = {
  slug: "dev-rook-check",
  title: "Dev: Rook Check",
  difficulty: 1,
} satisfies ContentMeta;

export const content = {
  mode: "last_move",
  sideToMove: "black",
  whiteKingside: false,
  whiteQueenside: false,
  blackKingside: false,
  blackQueenside: false,
  halfmove: 1,
  fullmove: 1,
  pieces: [
    { file: "a", rank: 8, colour: "black", piece: "king" },
    { file: "b", rank: 6, colour: "white", piece: "king" },
    { file: "a", rank: 1, colour: "white", piece: "rook" },
  ],
  solutionPlies: [
    {
      fromFile: "h",
      fromRank: 1,
      toFile: "a",
      toRank: 1,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies Content;
