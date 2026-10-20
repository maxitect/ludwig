import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "knight-taken",
  title: "Knight Taken",
  difficulty: 2,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: a3 Nc6 d4 e6 Nc3 Na5 Qd3 Bb4 Nh3 Bxc3+
export const content = {
  mode: "last_move",
  fen: "r1bqk1nr/pppp1ppp/4p3/n7/3P4/P1bQ3N/1PP1PPPP/R1B1KB1R w KQkq - 0 6",
  solutionPlies: [
    {
      fromFile: "b",
      fromRank: 4,
      toFile: "c",
      toRank: 3,
      uncapture: "knight",
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
