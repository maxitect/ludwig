import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "last-orders",
  title: "Last Orders",
  difficulty: 4,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 10,
  cols: 10,
  grid: [
    "0001123334",
    "5511123444",
    "6555728444",
    "66977784aa",
    "6699977444",
    "b6669444c4",
    "bd9999e4cc",
    "bddfffeggg",
    "bbhhieeegg",
    "bhhhiiejjg",
  ],
} satisfies Content;
