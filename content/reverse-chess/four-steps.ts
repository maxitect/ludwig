import type { ContentMeta } from "../../scripts/content-files";
import type { ContentFile } from "../../src/puzzles/reverse-chess/schema";

export const meta = {
  slug: "four-steps",
  title: "Four Steps",
  difficulty: 2,
  sourceNote:
    "Original position, built from a proof game by the Ludwig authors.",
  publishedAt: new Date("2026-10-06T00:00:00Z"),
} satisfies ContentMeta;

// Proof game: e3 d6 e4 d5 e5 d4 e6 d3
export const content = {
  mode: "unwind",
  goal: {
    kind: "initial_position",
    displayText: "Back to the starting position",
  },
  fen: "rnbqkbnr/ppp1pppp/4P3/8/8/3p4/PPPP1PPP/RNBQKBNR w KQkq - 0 5",
  solutionPlies: [
    {
      fromFile: "d",
      fromRank: 4,
      toFile: "d",
      toRank: 3,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "e",
      fromRank: 5,
      toFile: "e",
      toRank: 6,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "d",
      fromRank: 5,
      toFile: "d",
      toRank: 4,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "e",
      fromRank: 4,
      toFile: "e",
      toRank: 5,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "d",
      fromRank: 6,
      toFile: "d",
      toRank: 5,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "e",
      fromRank: 3,
      toFile: "e",
      toRank: 4,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "d",
      fromRank: 7,
      toFile: "d",
      toRank: 6,
      unpromote: false,
      special: "none",
    },
    {
      fromFile: "e",
      fromRank: 2,
      toFile: "e",
      toRank: 3,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
