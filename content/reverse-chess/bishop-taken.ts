import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "bishop-taken",
  title: "Bishop Taken",
  difficulty: 3,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-05T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: Nh3 Na6 Ng1 Nh6 c3 e5 f4 e4 d3 b6 Na3 e3 h4 Nb8 Bd2 b5 f5 exd2+
export const content = {
  mode: "last_move",
  fen: "rnbqkb1r/p1pp1ppp/7n/1p3P2/7P/N1PP4/PP1pP1P1/R2QKBNR w KQkq - 0 10",
  solutionPlies: [
    {
      fromFile: "e",
      fromRank: 3,
      toFile: "d",
      toRank: 2,
      uncapture: "bishop",
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
