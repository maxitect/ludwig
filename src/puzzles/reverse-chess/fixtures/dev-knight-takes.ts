import type { ContentMeta } from "../../../../scripts/content-files";
import type { ContentFile } from "../schema";

export const meta = {
  slug: "dev-knight-takes",
  title: "Dev: Knight Takes",
  difficulty: 2,
} satisfies ContentMeta;

/**
 * rnbqkb1r/pppppPpp/5pN1/8/8/8/PPPP1PPP/RNBQKB1R b - - 0 10
 * Proof game: 1.e3 f6 2.e4 Kf7 3.e5 Ke8 4.e6 Nh6 5.Nf3 Rg8 6.Nh4 Rh8 7.Ng6 Nc6 8.Ke2 Nb8 9.Ke1 Nf7 10.exf7+
 */
export const content = {
  mode: "last_move",
  fen: "rnbqkb1r/pppppPpp/5pN1/8/8/8/PPPP1PPP/RNBQKB1R b - - 0 10",
  solutionPlies: [
    {
      fromFile: "e",
      fromRank: 6,
      toFile: "f",
      toRank: 7,
      uncapture: "knight",
      unpromote: false,
      special: "none",
    },
  ],
} satisfies ContentFile;
