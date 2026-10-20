import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "nothing-hidden",
  title: "Nothing Hidden",
  difficulty: 5,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: b3 e6 d4 d5 f4 h6 Nh3 Qd7 g4 g6 c4 Ke7 Ng5 a6 Ne4 e5 h4 Ke6 Rh3 Qb5 Be3 f6 f5+
export const content = {
  mode: "last_move",
  fen: "rnb2bnr/1pp5/p3kppp/1q1ppP2/2PPN1PP/1P2B2R/P3P3/RN1QKB2 b Q - 0 12",
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
} satisfies ContentFile;
