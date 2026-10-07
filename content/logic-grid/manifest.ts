import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "manifest",
  title: "Manifest",
  difficulty: 4,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  categories: [
    { name: "Sailor", items: ["Anders", "Bea", "Carlo", "Dilys", "Emeka"] },
    { name: "Port", items: ["Oban", "Brest", "Cadiz", "Dover", "Genoa"] },
    { name: "Cargo", items: ["Tea", "Salt", "Timber", "Wool", "Coal"] },
    { name: "Berth", items: ["Forward", "Aft", "Midship", "Top bunk", "Lower bunk"] },
  ],
  solution: [
    ["Emeka", "Brest", "Timber", "Top bunk"],
    ["Dilys", "Dover", "Salt", "Forward"],
    ["Anders", "Genoa", "Wool", "Lower bunk"],
    ["Carlo", "Cadiz", "Tea", "Midship"],
    ["Bea", "Oban", "Coal", "Aft"],
  ],
  clues: [
    { content: "The manifest lists Bea against Coal.", rule: { kind: "is", a: "Bea", b: "Coal" } },
    { content: "The manifest never lists Dover against Coal.", rule: { kind: "isNot", a: "Dover", b: "Coal" } },
    { content: "Timber and Brest are entered together.", rule: { kind: "is", a: "Timber", b: "Brest" } },
    { content: "Dover and Wool are on separate entries.", rule: { kind: "isNot", a: "Dover", b: "Wool" } },
    { content: "Brest is not entered with Anders.", rule: { kind: "isNot", a: "Brest", b: "Anders" } },
    { content: "Bea is entered with Cadiz.", isFalse: true, rule: { kind: "is", a: "Bea", b: "Cadiz" } },
    { content: "The manifest lists Cadiz against Midship.", rule: { kind: "is", a: "Cadiz", b: "Midship" } },
    { content: "Tea and Midship are entered together.", rule: { kind: "is", a: "Tea", b: "Midship" } },
    { content: "Carlo is entered with Midship.", rule: { kind: "is", a: "Carlo", b: "Midship" } },
    { content: "The manifest never lists Anders against Oban.", rule: { kind: "isNot", a: "Anders", b: "Oban" } },
    { content: "Forward and Brest are on separate entries.", rule: { kind: "isNot", a: "Forward", b: "Brest" } },
    { content: "Dilys is entered with Coal or with Salt.", rule: { kind: "either", a: "Dilys", b: "Coal", c: "Salt" } },
    { content: "The manifest lists Coal against Aft.", rule: { kind: "is", a: "Coal", b: "Aft" } },
    { content: "Wool is not entered with Forward.", rule: { kind: "isNot", a: "Wool", b: "Forward" } },
    { content: "The manifest never lists Brest against Lower bunk.", rule: { kind: "isNot", a: "Brest", b: "Lower bunk" } },
  ],
} satisfies Content;
