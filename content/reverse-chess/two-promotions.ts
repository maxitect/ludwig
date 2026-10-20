import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "two-promotions",
  title: "Two Promotions",
  difficulty: 4,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-06T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: d4 c5 d5 c4 d6 c3 dxe7 cxb2 exd8=N bxc1=B
export const content = {
  mode: "unwind",
  goal: {
    kind: "initial_position",
    displayText: "Back to the starting position",
  },
  fen: "rnbNkbnr/pp1p1ppp/8/8/8/8/P1P1PPPP/RNbQKBNR w KQkq - 0 6",
  solutionPlies: [
    {
      fromFile: "b",
      fromRank: 2,
      toFile: "c",
      toRank: 1,
      uncapture: "bishop",
      unpromote: true,
      special: "none",
    },
    {
      fromFile: "e",
      fromRank: 7,
      toFile: "d",
      toRank: 8,
      uncapture: "queen",
      unpromote: true,
      special: "none",
    },
    {
      fromFile: "c",
      fromRank: 3,
      toFile: "b",
      toRank: 2,
      uncapture: "pawn",
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "d",
      fromRank: 6,
      toFile: "e",
      toRank: 7,
      uncapture: "pawn",
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "c",
      fromRank: 4,
      toFile: "c",
      toRank: 3,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "d",
      fromRank: 5,
      toFile: "d",
      toRank: 6,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "c",
      fromRank: 5,
      toFile: "c",
      toRank: 4,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "d",
      fromRank: 4,
      toFile: "d",
      toRank: 5,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "c",
      fromRank: 7,
      toFile: "c",
      toRank: 5,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "d",
      fromRank: 2,
      toFile: "d",
      toRank: 4,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
