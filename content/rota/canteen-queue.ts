import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/rota/schema";

export const meta = {
  slug: "canteen-queue",
  title: "Canteen Queue",
  difficulty: 4,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-06T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  workers: [
    { name: "Gareth", intended: { file: "a", rank: 5 }, final: { file: "a", rank: 5 } },
    { name: "Hywel", intended: { file: "c", rank: 7 }, final: { file: "b", rank: 6 } },
    { name: "Iwan", intended: { file: "a", rank: 7 }, final: { file: "c", rank: 6 } },
    { name: "Jac", intended: { file: "c", rank: 6 }, final: { file: "a", rank: 7 } },
    { name: "Keri", intended: { file: "e", rank: 6 }, final: { file: "e", rank: 6 } },
    { name: "Lowri", intended: { file: "b", rank: 7 }, final: { file: "c", rank: 7 } },
    { name: "Megan", intended: { file: "d", rank: 5 }, final: { file: "d", rank: 5 } },
    { name: "Nia", intended: { file: "b", rank: 6 }, final: { file: "b", rank: 7 } },
  ],
  clues: [
    { displayText: "Workers only ever swapped with a neighbour, one zone across or one zone up or down.", kind: "adjacent_only" },
    { displayText: "No more than 6 swaps were made.", kind: "max_swaps", maxSwaps: 6 },
    { displayText: "Zone A5 had no power all morning, so nobody swapped into or out of it.", kind: "unpowered_square", file: "a", rank: 5 },
    { displayText: "Jac never stood in a zone in row 4, at any point.", kind: "never_in_rank", rank: 4, workerName: "Jac" },
  ],
  solution: {
    instigatorName: "Hywel",
    swaps: [
      { a: "Hywel", b: "Jac" },
      { a: "Jac", b: "Lowri" },
      { a: "Iwan", b: "Jac" },
      { a: "Iwan", b: "Nia" },
      { a: "Hywel", b: "Iwan" },
    ],
  },
} satisfies Content;
