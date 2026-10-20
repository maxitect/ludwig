import type { ContentMeta } from "../../../../scripts/content-files";
import type { ContentFile } from "../schema";

export const meta = {
  slug: "dev-pawn-push",
  title: "Dev: Pawn Push",
  difficulty: 1,
} satisfies ContentMeta;

export const content = {
  mode: "last_move",
  fen: "8/1k6/P7/1p6/1B6/7K/1P6/8 b - - 0 1",
  solutionPlies: [
    {
      fromFile: "a",
      fromRank: 5,
      toFile: "a",
      toRank: 6,
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
