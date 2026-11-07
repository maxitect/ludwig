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
  brief: "Nia was found in **B7**, behind the walk-in freezer door, at ten past six. The rota pinned in the kitchen had her in **B6**.",
  victimName: "Nia",
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
    { displayText: "Swaps were only ever made with a neighbouring zone, one across or one up or down.", kind: "adjacent_only" },
    { displayText: "No more than 6 swaps were made.", kind: "max_swaps", maxSwaps: 6 },
    { displayText: "Zone A5 had no power all morning, so nobody swapped into or out of it.", kind: "unpowered_square", file: "a", rank: 5 },
    { displayText: "I never went down to row 4. The floor there is always wet.", kind: "never_in_rank", rank: 4, workerName: "Jac", speakerName: "Jac" },
    { displayText: "I never ask anyone to swap with me. They come to me.", kind: "not_instigator", workerName: "Jac", speakerName: "Jac" },
  ],
  solution: {
    instigatorName: "Hywel",
    swaps: [
      { a: "Hywel", b: "Jac", excuse: "Hywel said the sauce station in C7 was too hot for them and asked Jac to take it." },
      { a: "Jac", b: "Lowri", excuse: "Jac wanted to be beside the pass, so Lowri took the till end." },
      { a: "Iwan", b: "Jac", excuse: "Iwan wanted a break from the fryer and Jac was happy to take it." },
      { a: "Iwan", b: "Nia", excuse: "Nia was asked to cover the freezer corner while Iwan went for his break." },
      { a: "Hywel", b: "Iwan", excuse: "Hywel said the day had left them out of place and asked Iwan to even things up." },
    ],
  },
} satisfies Content;
