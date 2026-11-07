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
  brief: "Hobb was found at the foot of the hoist in **D3** at 11:40. The generator there had been rewired and stood in a puddle. The rota pinned up at eight had him in **D2**.",
  victimName: "Hobb",
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
    { displayText: "Swaps were only ever made with a neighbouring zone, one across or one up or down.", kind: "adjacent_only" },
    { displayText: "No more than 6 swaps were made.", kind: "max_swaps", maxSwaps: 6 },
    { displayText: "I never went near row 5. I don't do heights.", kind: "never_in_rank", rank: 5, workerName: "Colm", speakerName: "Colm" },
    { displayText: "Row 5 is the top deck. Not once did I stand up there.", kind: "never_in_rank", rank: 5, workerName: "Fenn", speakerName: "Fenn" },
    { displayText: "I never ask for swaps. People ask me.", kind: "not_instigator", workerName: "Gwyn", speakerName: "Gwyn" },
  ],
  solution: {
    instigatorName: "Fenn",
    swaps: [
      { a: "Fenn", b: "Gwyn", excuse: "Fenn said the ladder in C4 made them dizzy and asked Gwyn to take it." },
      { a: "Ewan", b: "Fenn", excuse: "Ewan wanted to be nearer the stores, so they changed places." },
      { a: "Dessa", b: "Ewan", excuse: "Dessa had a bad knee and asked for the quieter zone." },
      { a: "Colm", b: "Ewan", excuse: "Colm swore he could not work beside the noisy mixer." },
      { a: "Colm", b: "Hobb", excuse: "Hobb, the site joker, said he would take Colm's zone for a laugh." },
    ],
  },
} satisfies Content;
