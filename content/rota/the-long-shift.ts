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
  brief: "Yara was found at **D1**, under the crane, as the shift ended. The rota had her on **E3**.",
  victimName: "Yara",
  workers: [
    { name: "Vik", intended: { file: "c", rank: 3 }, final: { file: "c", rank: 3 } },
    { name: "Wren", intended: { file: "d", rank: 1 }, final: { file: "e", rank: 3 } },
    { name: "Xavi", intended: { file: "f", rank: 1 }, final: { file: "e", rank: 1 } },
    { name: "Yara", intended: { file: "e", rank: 3 }, final: { file: "d", rank: 1 } },
    { name: "Zane", intended: { file: "e", rank: 2 }, final: { file: "d", rank: 2 } },
    { name: "Abel", intended: { file: "e", rank: 1 }, final: { file: "e", rank: 2 } },
    { name: "Bea", intended: { file: "c", rank: 1 }, final: { file: "c", rank: 1 } },
    { name: "Cole", intended: { file: "f", rank: 3 }, final: { file: "f", rank: 3 } },
    { name: "Dara", intended: { file: "d", rank: 2 }, final: { file: "f", rank: 1 } },
  ],
  clues: [
    { displayText: "Swaps were only ever made with a neighbouring zone, one across or one up or down.", kind: "adjacent_only" },
    { displayText: "No more than 6 swaps were made.", kind: "max_swaps", maxSwaps: 6 },
    { displayText: "Row 4 is the crane deck. I never went up.", kind: "never_in_rank", rank: 4, workerName: "Wren", speakerName: "Wren" },
    { displayText: "I have never worked row 1. The diesel fumes get to me.", kind: "never_in_rank", rank: 1, workerName: "Zane", speakerName: "Zane" },
    { displayText: "I never ask for swaps. People ask me.", kind: "not_instigator", workerName: "Wren", speakerName: "Wren" },
  ],
  solution: {
    instigatorName: "Dara",
    swaps: [
      { a: "Dara", b: "Wren", excuse: "Dara said D1 was nearer the stores and asked Wren to take the quieter D2." },
      { a: "Wren", b: "Zane", excuse: "Wren wanted to be near the water tap, so Zane took the corner." },
      { a: "Wren", b: "Yara", excuse: "Wren wanted a seat and Yara offered to cover the zone." },
      { a: "Abel", b: "Yara", excuse: "Abel's back was playing up and he wanted somewhere to lean." },
      { a: "Dara", b: "Yara", excuse: "Dara said the dark zone under the crane would suit Yara, who liked to work in shade." },
      { a: "Dara", b: "Xavi", excuse: "Dara finally swapped with Xavi, who had been asking for the end spot all week." },
    ],
  },
} satisfies Content;
