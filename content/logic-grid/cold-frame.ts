import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "cold-frame",
  title: "Cold Frame",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Someone has been at the allotments overnight. The committee has taken a statement from each of five gardeners, and between them they pin down every plot, crop and tool.",
  categories: [
    { name: "Gardener", items: ["Hettie", "Ivor", "Joan", "Kofi", "Lena"] },
    { name: "Plot", items: ["Oak corner", "Pond edge", "Hilltop", "Gate side", "Compost end"] },
    { name: "Crop", items: ["Leeks", "Beans", "Squash", "Kale", "Beetroot"] },
    { name: "Tool", items: ["Spade", "Hoe", "Fork", "Rake", "Trowel"] },
  ],
  solution: [
    ["Lena", "Gate side", "Leeks", "Spade"],
    ["Ivor", "Pond edge", "Squash", "Trowel"],
    ["Hettie", "Compost end", "Beetroot", "Rake"],
    ["Kofi", "Hilltop", "Beans", "Fork"],
    ["Joan", "Oak corner", "Kale", "Hoe"],
  ],
  clues: [
    { content: "The shed book has the Rake signed out for the Beetroot.", rule: { kind: "is", a: "Rake", b: "Beetroot" } },
    { content: "I never touched the Fork.", speaker: "Ivor", rule: { kind: "isNot", a: "Fork", b: "Ivor" } },
    { content: "The Beetroot is at the Compost end.", speaker: "Joan", rule: { kind: "is", a: "Beetroot", b: "Compost end" } },
    { content: "The Hoe was mine.", speaker: "Joan", rule: { kind: "is", a: "Joan", b: "Hoe" } },
    { content: "I had the Rake.", speaker: "Hettie", rule: { kind: "is", a: "Hettie", b: "Rake" } },
    { content: "I never worked Oak corner.", speaker: "Lena", rule: { kind: "isNot", a: "Lena", b: "Oak corner" } },
    { content: "The plot map never shows Leeks on Hilltop.", rule: { kind: "isNot", a: "Hilltop", b: "Leeks" } },
    { content: "Oak corner was never my patch.", speaker: "Kofi", rule: { kind: "isNot", a: "Kofi", b: "Oak corner" } },
    { content: "Lena was never down at Pond edge.", speaker: "Ivor", rule: { kind: "isNot", a: "Lena", b: "Pond edge" } },
    { content: "The plot map never has Squash on Hilltop.", rule: { kind: "isNot", a: "Hilltop", b: "Squash" } },
    { content: "At Oak corner they use the Hoe or the Fork.", speaker: "Kofi", rule: { kind: "either", a: "Oak corner", b: "Hoe", c: "Fork" } },
    { content: "The shed book puts the Spade at Oak corner or Gate side.", rule: { kind: "either", a: "Spade", b: "Oak corner", c: "Gate side" } },
    { content: "The Leeks are mine.", speaker: "Lena", rule: { kind: "is", a: "Leeks", b: "Lena" } },
    { content: "The shed book never sends the Trowel to Hilltop.", rule: { kind: "isNot", a: "Trowel", b: "Hilltop" } },
    { content: "The Hoe goes with the Kale.", speaker: "Joan", rule: { kind: "is", a: "Hoe", b: "Kale" } },
  ],
} satisfies Content;
