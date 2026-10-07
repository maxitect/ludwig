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
  workers: [
    { name: "Aled", intended: { file: "e", rank: 8 }, final: { file: "c", rank: 6 } },
    { name: "Bryn", intended: { file: "c", rank: 5 }, final: { file: "e", rank: 8 } },
    { name: "Cerys", intended: { file: "g", rank: 5 }, final: { file: "c", rank: 5 } },
    { name: "Dai", intended: { file: "c", rank: 6 }, final: { file: "g", rank: 5 } },
    { name: "Elin", intended: { file: "g", rank: 7 }, final: { file: "g", rank: 7 } },
    { name: "Fflur", intended: { file: "f", rank: 7 }, final: { file: "f", rank: 7 } },
  ],
  clues: [
    { displayText: "Bryn never stood in a zone in row 6, at any point.", kind: "never_in_rank", rank: 6, workerName: "Bryn" },
    { displayText: "Aled never stood in a zone in row 5, at any point.", kind: "never_in_rank", rank: 5, workerName: "Aled" },
    { displayText: "Dai never stood in a zone in row 8, at any point.", kind: "never_in_rank", rank: 8, workerName: "Dai" },
    { displayText: "No more than 4 swaps were made.", kind: "max_swaps", maxSwaps: 4 },
  ],
  solution: {
    instigatorName: "Cerys",
    swaps: [
      { a: "Cerys", b: "Dai" },
      { a: "Aled", b: "Cerys" },
      { a: "Bryn", b: "Cerys" },
    ],
  },
} satisfies Content;
