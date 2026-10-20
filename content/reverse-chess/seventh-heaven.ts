import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "seventh-heaven",
  title: "Seventh Heaven",
  difficulty: 4,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: Nf3 g6 Ne5 d5 Nc4 h6 Nc3 Nd7 d3 b6 b3 dxc4 e4 Ndf6 Qd2 c5 Be2 a6 Rf1 h5 Qf4 cxd3 Be3 d2+
export const content = {
  mode: "last_move",
  fen: "r1bqkbnr/4pp2/pp3np1/2p4p/4PQ2/1PN1B3/P1PpBPPP/R3KR2 w Qkq - 0 13",
  solutionPlies: [
    {
      fromFile: "d",
      fromRank: 3,
      toFile: "d",
      toRank: 2,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
