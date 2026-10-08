import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-search/schema";

export const meta = {
  slug: "round-up",
  title: "Round Up",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "FFQPBLIART",
    "ZZATMOTIVE",
    "SMDIIBILAE",
    "FUFNOCWYCJ",
    "FLSVJIUNPT",
    "KIAPTIELRD",
    "CLKNEDRKOL",
    "YLEAICUWOL",
    "SSUVFGTFFM",
    "SBEEMFAEGM",
  ],
  words: ["ALIBI", "CLUE", "EVIDENCE", "MOTIVE", "PROOF", "SUSPECT", "TRAIL", "WITNESS"],
} satisfies Content;
