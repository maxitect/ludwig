import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "reading-room",
  title: "Reading Room",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Closing time at the library. The night porter found four cups and four books left out, and each reader remembers the evening differently.",
  categories: [
    { name: "Reader", items: ["Agnes", "Bertie", "Cora", "Dev"] },
    { name: "Book", items: ["Atlas", "Almanac", "Folio", "Primer"] },
    { name: "Seat", items: ["Window", "Stairs", "Fireplace", "Corner"] },
    { name: "Drink", items: ["Tea", "Cocoa", "Cider", "Water"] },
  ],
  solution: [
    ["Cora", "Primer", "Window", "Cocoa"],
    ["Bertie", "Folio", "Stairs", "Water"],
    ["Dev", "Atlas", "Corner", "Cider"],
    ["Agnes", "Almanac", "Fireplace", "Tea"],
  ],
  clues: [
    { content: "I never opened the Atlas.", speaker: "Bertie", rule: { kind: "isNot", a: "Atlas", b: "Bertie" } },
    { content: "I sat in the Window.", speaker: "Cora", rule: { kind: "is", a: "Window", b: "Cora" } },
    { content: "I was reading the Almanac.", speaker: "Agnes", rule: { kind: "is", a: "Almanac", b: "Agnes" } },
    { content: "Cora drank Cocoa all evening.", speaker: "Dev", rule: { kind: "is", a: "Cora", b: "Cocoa" } },
    { content: "Bertie never took the Primer. I had it.", speaker: "Cora", rule: { kind: "isNot", a: "Bertie", b: "Primer" } },
    { content: "The porter never put Cider beside the Almanac.", rule: { kind: "isNot", a: "Almanac", b: "Cider" } },
    { content: "I took the Atlas into the Corner.", speaker: "Dev", rule: { kind: "is", a: "Atlas", b: "Corner" } },
    { content: "Whoever sat on the Stairs had the Water.", speaker: "Agnes", rule: { kind: "is", a: "Water", b: "Stairs" } },
    { content: "I was never on the Stairs.", speaker: "Agnes", rule: { kind: "isNot", a: "Agnes", b: "Stairs" } },
  ],
} satisfies Content;
