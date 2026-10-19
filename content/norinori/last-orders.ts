import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "last-orders",
  title: "Last Orders",
  difficulty: 4,
  publishedAt: new Date("2026-10-17T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 9,
  cols: 9,
  grid: [
    "000011122",
    "333331425",
    "637771445",
    "666788495",
    "6a77b8495",
    "6a7bbbb55",
    "6bbbccc55",
    "dbebbbfff",
    "dbebbbbbb",
  ],
} satisfies Content;
