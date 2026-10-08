import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/word-search/schema";

export const meta = {
  slug: "long-vacation",
  title: "Long Vacation",
  difficulty: 1,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "GSGOWNVC",
    "WUKQUADM",
    "TUTORDAS",
    "ASCHOLAR",
    "EXYWCTUP",
    "QARWSSVU",
    "GPORTERN",
    "BMHRGQRT",
  ],
  words: ["GOWN", "PORTER", "PUNT", "QUAD", "SCHOLAR", "TUTOR"],
} satisfies Content;
