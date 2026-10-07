import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "cold-frame",
  title: "Cold Frame",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
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
    { content: "The file puts Rake together with Beetroot.", rule: { kind: "is", a: "Rake", b: "Beetroot" } },
    { content: "Nothing in the file connects Fork and Ivor.", rule: { kind: "isNot", a: "Fork", b: "Ivor" } },
    { content: "Beetroot and Compost end turn out to be connected.", rule: { kind: "is", a: "Beetroot", b: "Compost end" } },
    { content: "A note in the file links Joan to Hoe.", rule: { kind: "is", a: "Joan", b: "Hoe" } },
    { content: "The file puts Hettie together with Rake.", rule: { kind: "is", a: "Hettie", b: "Rake" } },
    { content: "Lena was nowhere near Oak corner.", rule: { kind: "isNot", a: "Lena", b: "Oak corner" } },
    { content: "The file rules out any link between Hilltop and Leeks.", rule: { kind: "isNot", a: "Hilltop", b: "Leeks" } },
    { content: "Nothing in the file connects Kofi and Oak corner.", rule: { kind: "isNot", a: "Kofi", b: "Oak corner" } },
    { content: "Lena was nowhere near Pond edge.", rule: { kind: "isNot", a: "Lena", b: "Pond edge" } },
    { content: "The file rules out any link between Hilltop and Squash.", rule: { kind: "isNot", a: "Hilltop", b: "Squash" } },
    { content: "Oak corner is connected to Hoe or to Fork.", rule: { kind: "either", a: "Oak corner", b: "Hoe", c: "Fork" } },
    { content: "The file links Spade with Oak corner or with Gate side.", rule: { kind: "either", a: "Spade", b: "Oak corner", c: "Gate side" } },
    { content: "Leeks and Lena turn out to be connected.", rule: { kind: "is", a: "Leeks", b: "Lena" } },
    { content: "Nothing in the file connects Trowel and Hilltop.", rule: { kind: "isNot", a: "Trowel", b: "Hilltop" } },
    { content: "A note in the file links Hoe to Kale.", rule: { kind: "is", a: "Hoe", b: "Kale" } },
  ],
} satisfies Content;
