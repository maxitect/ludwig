import type { ContentMeta } from "../../scripts/content-files";
import type { Provenance } from "../../src/puzzles/generators";
import type { Content } from "../../src/puzzles/circle9/schema";

export const meta = {
  slug: "side-street",
  title: "Side Street",
  difficulty: 1,
  publishedAt: new Date("2026-10-23T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  grid: [
    "..61....7", ".......5.", "3...3....", "...4....7", ".7..1....", "......538", "6....2..5", "...5.89.2", "15.....12",
  ],
} satisfies Content;

export const generated = { generator: "circle9", version: 1, seed: "side-street" } satisfies Provenance;
