import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "waiting-room",
  title: "Waiting Room",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Five passengers were held at the station when the 9:40 was stopped. The stationmaster has taken a statement from each. One of them is a lie.",
  categories: [
    { name: "Passenger", items: ["Alma", "Bruno", "Cyrus", "Dana", "Edda"] },
    { name: "Destination", items: ["Leeds", "Hull", "Ely", "Bath", "Rye"] },
    { name: "Platform", items: ["Platform 1", "Platform 2", "Platform 3", "Platform 4", "Platform 5"] },
  ],
  solution: [
    ["Alma", "Bath", "Platform 2"],
    ["Dana", "Leeds", "Platform 5"],
    ["Bruno", "Ely", "Platform 4"],
    ["Cyrus", "Hull", "Platform 3"],
    ["Edda", "Rye", "Platform 1"],
  ],
  clues: [
    { content: "The ticket office never sold a Hull ticket for Platform 5.", rule: { kind: "isNot", a: "Hull", b: "Platform 5" } },
    { content: "I never stood on Platform 4.", speaker: "Dana", rule: { kind: "isNot", a: "Dana", b: "Platform 4" } },
    { content: "The porter says the Bath train left from Platform 2 or Platform 1.", rule: { kind: "either", a: "Bath", b: "Platform 2", c: "Platform 1" } },
    { content: "The guard never saw a Rye passenger on Platform 4.", rule: { kind: "isNot", a: "Platform 4", b: "Rye" } },
    { content: "Dana wasn't going to Bath. She told me so on the platform.", speaker: "Bruno", rule: { kind: "isNot", a: "Dana", b: "Bath" } },
    { content: "Rye? That train never left from Platform 5.", speaker: "Alma", rule: { kind: "isNot", a: "Platform 5", b: "Rye" } },
    { content: "I'm going to Rye.", speaker: "Edda", rule: { kind: "is", a: "Rye", b: "Edda" } },
    { content: "My ticket says Ely.", speaker: "Bruno", rule: { kind: "is", a: "Ely", b: "Bruno" } },
    { content: "I'm on the Bath train.", isFalse: true, speaker: "Cyrus", rule: { kind: "is", a: "Cyrus", b: "Bath" } },
    { content: "The guard says the Rye train never ran from Platform 2.", rule: { kind: "isNot", a: "Platform 2", b: "Rye" } },
    { content: "Cyrus was waiting on Platform 3 when I arrived.", speaker: "Alma", rule: { kind: "is", a: "Platform 3", b: "Cyrus" } },
  ],
} satisfies Content;
