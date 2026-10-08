import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-search/schema";

export const meta = {
  slug: "opening-gambit",
  title: "Opening Gambit",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "UVTJLBHLQS",
    "GWYBIUPOQL",
    "HNRSEQVEFN",
    "ALHELGRFOE",
    "POTQTKOSRE",
    "PKHJSKOOKU",
    "ACGUAAKUKQ",
    "WEICCEIRWF",
    "NHNGJWPRNM",
    "TCKJQFWPAB",
  ],
  words: ["BISHOP", "CASTLE", "CHECK", "FORK", "KNIGHT", "PAWN", "QUEEN", "ROOK"],
} satisfies Content;
