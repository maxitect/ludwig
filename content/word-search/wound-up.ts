import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-search/schema";

export const meta = {
  slug: "wound-up",
  title: "Wound Up",
  difficulty: 4,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "LKOCEGFIQKZX",
    "UGPEOZEXNHUC",
    "KUQQIGCATTMF",
    "SSUUWTJORLNW",
    "UPIKWYOHXREQ",
    "CMINTTSUVTFA",
    "MRLNNFPQEAIJ",
    "KEAXAUAHKLLI",
    "NOINIPCXGWFW",
    "RUPSKTGKLORO",
    "RTNSAKSGWERR",
    "CHLREFWQKRZM",
  ],
  words: ["AXLE", "COG", "CRANK", "GEAR", "PINION", "RATCHET", "SPIN", "SPUR", "TOOTH", "WORM"],
} satisfies Content;
