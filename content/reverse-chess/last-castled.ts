import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "last-castled",
  title: "Last Castled",
  difficulty: 4,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: Nf3 Nf6 g3 g6 Bg2 Bg7 h3 Ng4 O-O Nh2
export const content = {
  mode: "unwind",
  goal: {
    kind: "castling_right",
    displayText: "The moment White last castled",
    colour: "white",
    side: "kingside",
  },
  fen: "rnbqk2r/ppppppbp/6p1/8/8/5NPP/PPPPPPBn/RNBQ1RK1 w kq - 3 6",
  solutionPlies: [
    {
      fromFile: "g",
      fromRank: 4,
      toFile: "h",
      toRank: 2,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "e",
      fromRank: 1,
      toFile: "g",
      toRank: 1,
      unpromote: false,
      special: "castle",
    },
  ],
} satisfies ContentFile;
