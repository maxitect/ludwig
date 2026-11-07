import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "manifest",
  title: "Manifest",
  difficulty: 4,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "The Marguerite docked short of her manifest, and the harbour master has her five crew in one by one. Each swears to a port, a cargo and a berth. One of them is lying.",
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
    { content: "I loaded the Coal myself.", speaker: "Bea", rule: { kind: "is", a: "Bea", b: "Coal" } },
    { content: "The Coal never came ashore at Dover.", speaker: "Anders", rule: { kind: "isNot", a: "Dover", b: "Coal" } },
    { content: "The Timber went ashore at Brest.", speaker: "Carlo", rule: { kind: "is", a: "Timber", b: "Brest" } },
    { content: "I never saw Wool come off at Dover.", speaker: "Dilys", rule: { kind: "isNot", a: "Dover", b: "Wool" } },
    { content: "I never set foot in Brest.", speaker: "Anders", rule: { kind: "isNot", a: "Brest", b: "Anders" } },
    { content: "I made port at Cadiz.", isFalse: true, speaker: "Bea", rule: { kind: "is", a: "Bea", b: "Cadiz" } },
    { content: "Whoever made port at Cadiz slept Midship.", speaker: "Dilys", rule: { kind: "is", a: "Cadiz", b: "Midship" } },
    { content: "The Tea was stowed Midship. I helped carry it.", speaker: "Emeka", rule: { kind: "is", a: "Tea", b: "Midship" } },
    { content: "I slept Midship.", speaker: "Carlo", rule: { kind: "is", a: "Carlo", b: "Midship" } },
    { content: "Anders never called at Oban.", speaker: "Emeka", rule: { kind: "isNot", a: "Anders", b: "Oban" } },
    { content: "The one from Brest never slept Forward.", speaker: "Bea", rule: { kind: "isNot", a: "Forward", b: "Brest" } },
    { content: "My cargo was Coal or Salt.", speaker: "Dilys", rule: { kind: "either", a: "Dilys", b: "Coal", c: "Salt" } },
    { content: "The Coal was stowed Aft.", speaker: "Anders", rule: { kind: "is", a: "Coal", b: "Aft" } },
    { content: "We never stowed the Wool Forward.", speaker: "Emeka", rule: { kind: "isNot", a: "Wool", b: "Forward" } },
    { content: "The Lower bunk never belonged to the man from Brest.", speaker: "Carlo", rule: { kind: "isNot", a: "Brest", b: "Lower bunk" } },
  ],
} satisfies Content;
