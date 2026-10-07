import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/rota/schema";

export const meta = {
  slug: "the-long-shift",
  title: "The Long Shift",
  difficulty: 5,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-06T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  workers: [
    {
      name: "Vik",
      intended: { file: "c", rank: 3 },
      final: { file: "c", rank: 3 },
    },
    {
      name: "Wren",
      intended: { file: "d", rank: 1 },
      final: { file: "e", rank: 3 },
    },
    {
      name: "Xavi",
      intended: { file: "f", rank: 1 },
      final: { file: "e", rank: 1 },
    },
    {
      name: "Yara",
      intended: { file: "e", rank: 3 },
      final: { file: "d", rank: 1 },
    },
    {
      name: "Zane",
      intended: { file: "e", rank: 2 },
      final: { file: "d", rank: 2 },
    },
    {
      name: "Abel",
      intended: { file: "e", rank: 1 },
      final: { file: "e", rank: 2 },
    },
    {
      name: "Bea",
      intended: { file: "c", rank: 1 },
      final: { file: "c", rank: 1 },
    },
    {
      name: "Cole",
      intended: { file: "f", rank: 3 },
      final: { file: "f", rank: 3 },
    },
    {
      name: "Dara",
      intended: { file: "d", rank: 2 },
      final: { file: "f", rank: 1 },
    },
  ],
  clues: [
    {
      displayText:
        "Workers only ever swapped with a neighbour, one zone across or one zone up or down.",
      kind: "adjacent_only",
    },
    {
      displayText: "No more than 6 swaps were made.",
      kind: "max_swaps",
      maxSwaps: 6,
    },
    {
      displayText: "Wren never stood in a zone in row 4, at any point.",
      kind: "never_in_rank",
      rank: 4,
      workerName: "Wren",
    },
    {
      displayText: "Zane never stood in a zone in row 1, at any point.",
      kind: "never_in_rank",
      rank: 1,
      workerName: "Zane",
    },
  ],
  solution: {
    instigatorName: "Dara",
    swaps: [
      { a: "Dara", b: "Wren" },
      { a: "Wren", b: "Zane" },
      { a: "Wren", b: "Yara" },
      { a: "Abel", b: "Yara" },
      { a: "Dara", b: "Yara" },
      { a: "Dara", b: "Xavi" },
    ],
  },
} satisfies Content;
