import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/rota/schema";

export const meta = {
  slug: "the-building-site",
  title: "The Building Site",
  difficulty: 3,
  sourceNote:
    "Original puzzle by the Ludwig authors, modelled on the rota case in series 1, episode 4, with different workers.",
  publishedAt: new Date("2026-10-06T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  workers: [
    { name: "Bridget", intended: { file: "e", rank: 3 }, final: { file: "e", rank: 3 } },
    { name: "Colm", intended: { file: "d", rank: 4 }, final: { file: "d", rank: 2 } },
    { name: "Dessa", intended: { file: "d", rank: 3 }, final: { file: "c", rank: 3 } },
    { name: "Ewan", intended: { file: "c", rank: 2 }, final: { file: "d", rank: 4 } },
    { name: "Fenn", intended: { file: "c", rank: 4 }, final: { file: "c", rank: 2 } },
    { name: "Gwyn", intended: { file: "c", rank: 3 }, final: { file: "c", rank: 4 } },
    { name: "Hobb", intended: { file: "d", rank: 2 }, final: { file: "d", rank: 3 } },
  ],
  clues: [
    { displayText: "Workers only ever swapped with a neighbour, one zone across or one zone up or down.", kind: "adjacent_only" },
    { displayText: "No more than 6 swaps were made.", kind: "max_swaps", maxSwaps: 6 },
    { displayText: "Colm never stood in a zone in row 5, at any point.", kind: "never_in_rank", rank: 5, workerName: "Colm" },
    { displayText: "Fenn never stood in a zone in row 5, at any point.", kind: "never_in_rank", rank: 5, workerName: "Fenn" },
  ],
  solution: {
    instigatorName: "Fenn",
    swaps: [
      { a: "Fenn", b: "Gwyn" },
      { a: "Ewan", b: "Fenn" },
      { a: "Dessa", b: "Ewan" },
      { a: "Colm", b: "Ewan" },
      { a: "Colm", b: "Hobb" },
    ],
  },
} satisfies Content;
