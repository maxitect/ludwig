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
  brief: "Rhys fell from the scaffold at **E2** just after noon. The rota had him on **F1**, at the foot of the stair.",
  victimName: "Rhys",
  workers: [
    { name: "Odette", intended: { file: "e", rank: 1 }, final: { file: "e", rank: 1 } },
    { name: "Pru", intended: { file: "c", rank: 3 }, final: { file: "d", rank: 1 } },
    { name: "Quinn", intended: { file: "e", rank: 2 }, final: { file: "c", rank: 3 } },
    { name: "Rhys", intended: { file: "f", rank: 1 }, final: { file: "e", rank: 2 } },
    { name: "Sian", intended: { file: "d", rank: 1 }, final: { file: "f", rank: 1 } },
    { name: "Tomos", intended: { file: "d", rank: 3 }, final: { file: "d", rank: 3 } },
  ],
  clues: [
    { displayText: "I never took a turn in row 1, not once.", kind: "never_in_rank", rank: 1, workerName: "Quinn", speakerName: "Quinn" },
    { displayText: "Row 2 is the top lift. I stayed away from it all day.", kind: "never_in_rank", rank: 2, workerName: "Pru", speakerName: "Pru" },
    { displayText: "Rhys never set foot in row 3. He had lost his nerve on the high boards.", kind: "never_in_rank", rank: 3, workerName: "Rhys", speakerName: "Sian" },
    { displayText: "No more than 3 swaps were made.", kind: "max_swaps", maxSwaps: 3 },
    { displayText: "I never ask for swaps. People ask me.", kind: "not_instigator", workerName: "Sian", speakerName: "Sian" },
  ],
  solution: {
    instigatorName: "Pru",
    swaps: [
      { a: "Pru", b: "Sian", excuse: "Pru said the sun was in her eyes on C3 and asked Sian to take it." },
      { a: "Quinn", b: "Sian", excuse: "Quinn wanted the end of the row, near the tea urn." },
      { a: "Rhys", b: "Sian", excuse: "Sian was feeling unwell and asked Rhys to take over the scaffold zone." },
    ],
  },
} satisfies Content;
