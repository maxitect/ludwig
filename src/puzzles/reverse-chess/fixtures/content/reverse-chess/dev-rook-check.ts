import type { ContentMeta } from "../../../../../../scripts/content-files";
import type { ContentFile } from "../../../schema";

export const meta = {
  slug: "dev-rook-check",
  title: "Dev: Rook Check",
  difficulty: 1,
} satisfies ContentMeta;

export const content = {
  mode: "last_move",
  fen: "k7/8/1K6/8/8/8/8/R7 b - - 1 1",
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
} satisfies ContentFile;
