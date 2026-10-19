import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/norinori/schema";

export const meta = {
  slug: "night-owls",
  title: "Night Owls",
  difficulty: 2,
  publishedAt: new Date("2026-10-14T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 7,
  cols: 7,
  grid: [
    "0011223",
    "4511113",
    "4551113",
    "4466111",
    "4667777",
    "4777787",
    "4799788",
  ],
} satisfies Content;
