import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/rota/schema";

export const meta = {
  slug: "night-shift",
  title: "Night Shift",
  difficulty: 1,
  sourceNote: "Original puzzle by the Ludwig authors.",
  publishedAt: new Date("2026-10-06T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Bryn was found in **E8**, beside the loading bay door, at four in the morning. The rota left on the desk had him in **C5**.",
  victimName: "Bryn",
  workers: [
    { name: "Aled", intended: { file: "e", rank: 8 }, final: { file: "c", rank: 6 } },
    { name: "Bryn", intended: { file: "c", rank: 5 }, final: { file: "e", rank: 8 } },
    { name: "Cerys", intended: { file: "g", rank: 5 }, final: { file: "c", rank: 5 } },
    { name: "Dai", intended: { file: "c", rank: 6 }, final: { file: "g", rank: 5 } },
    { name: "Elin", intended: { file: "g", rank: 7 }, final: { file: "g", rank: 7 } },
    { name: "Fflur", intended: { file: "f", rank: 7 }, final: { file: "f", rank: 7 } },
  ],
  clues: [
    { displayText: "Bryn would not go near row 6. He hated the cold store.", kind: "never_in_rank", rank: 6, workerName: "Bryn", speakerName: "Elin" },
    { displayText: "I never stood in row 5 all night.", kind: "never_in_rank", rank: 5, workerName: "Aled", speakerName: "Aled" },
    { displayText: "Dai was never in row 8 that night. He was with me.", kind: "never_in_rank", rank: 8, workerName: "Dai", speakerName: "Fflur" },
    { displayText: "No more than 4 swaps were made.", kind: "max_swaps", maxSwaps: 4 },
    { displayText: "I don't ask for swaps. I take what the rota gives me.", kind: "not_instigator", workerName: "Dai", speakerName: "Dai" },
  ],
  solution: {
    instigatorName: "Cerys",
    swaps: [
      { a: "Cerys", b: "Dai", excuse: "Cerys said the forklift in G5 gave her a headache and asked Dai to take it." },
      { a: "Aled", b: "Cerys", excuse: "Aled asked to be nearer the break room, so Cerys took his bay." },
      { a: "Bryn", b: "Cerys", excuse: "Cerys said she had to be by the door for a delivery, and Bryn offered to cover the bay." },
    ],
  },
} satisfies Content;
