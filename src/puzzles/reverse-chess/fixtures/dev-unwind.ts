import type { ContentMeta } from "../../../../scripts/content-files";
import type { ContentFile } from "../schema";

export const meta = {
  slug: "dev-unwind",
  title: "Dev: Unwind",
  difficulty: 1,
} satisfies ContentMeta;

export const content = {
  mode: "unwind",
  goal: {
    kind: "piece_on_square",
    displayText: "Before the black pawn left the a7 square",
    colour: "black",
    piece: "pawn",
    file: "a",
    rank: 7,
  },
  fen: "6Nk/1p2pppp/p4p1p/8/8/P1P4P/PPPP2P1/KN6 b - - 0 1",
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
} satisfies ContentFile;
