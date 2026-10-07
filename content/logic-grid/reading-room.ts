import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "reading-room",
  title: "Reading Room",
  difficulty: 2,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
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
    { content: "Atlas is not paired with Bertie.", rule: { kind: "isNot", a: "Atlas", b: "Bertie" } },
    { content: "Window is paired with Cora on the plan.", rule: { kind: "is", a: "Window", b: "Cora" } },
    { content: "On the plan, Almanac sits with Agnes.", rule: { kind: "is", a: "Almanac", b: "Agnes" } },
    { content: "Cora and Cocoa are the same entry.", rule: { kind: "is", a: "Cora", b: "Cocoa" } },
    { content: "The plan never pairs Bertie with Primer.", rule: { kind: "isNot", a: "Bertie", b: "Primer" } },
    { content: "Cider is not the entry for Almanac.", rule: { kind: "isNot", a: "Almanac", b: "Cider" } },
    { content: "Atlas is paired with Corner on the plan.", rule: { kind: "is", a: "Atlas", b: "Corner" } },
    { content: "On the plan, Water sits with Stairs.", rule: { kind: "is", a: "Water", b: "Stairs" } },
    { content: "Agnes is not paired with Stairs.", rule: { kind: "isNot", a: "Agnes", b: "Stairs" } },
  ],
} satisfies Content;
