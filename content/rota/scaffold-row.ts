import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/rota/schema";

export const meta = {
  slug: "scaffold-row",
  title: "Scaffold Row",
  difficulty: 2,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-06T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  workers: [
    { name: "Odette", intended: { file: "e", rank: 1 }, final: { file: "e", rank: 1 } },
    { name: "Pru", intended: { file: "c", rank: 3 }, final: { file: "d", rank: 1 } },
    { name: "Quinn", intended: { file: "e", rank: 2 }, final: { file: "c", rank: 3 } },
    { name: "Rhys", intended: { file: "f", rank: 1 }, final: { file: "e", rank: 2 } },
    { name: "Sian", intended: { file: "d", rank: 1 }, final: { file: "f", rank: 1 } },
    { name: "Tomos", intended: { file: "d", rank: 3 }, final: { file: "d", rank: 3 } },
  ],
  clues: [
    { displayText: "Quinn never stood in a zone in row 1, at any point.", kind: "never_in_rank", rank: 1, workerName: "Quinn" },
    { displayText: "Pru never stood in a zone in row 2, at any point.", kind: "never_in_rank", rank: 2, workerName: "Pru" },
    { displayText: "Rhys never stood in a zone in row 3, at any point.", kind: "never_in_rank", rank: 3, workerName: "Rhys" },
    { displayText: "No more than 3 swaps were made.", kind: "max_swaps", maxSwaps: 3 },
  ],
  solution: {
    instigatorName: "Pru",
    swaps: [
      { a: "Pru", b: "Sian" },
      { a: "Quinn", b: "Sian" },
      { a: "Rhys", b: "Sian" },
    ],
  },
} satisfies Content;
