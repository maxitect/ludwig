import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "open-plan",
  title: "Open Plan",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  brief: "Four inspectors walked the new office block before the opening. Each wrote up one defect on one floor, and the site manager wants to know who found what, and where.",
  categories: [
    { name: "Inspector", items: ["Sarah", "Tom", "Priya", "Marcus"] },
    { name: "Defect", items: ["Fire door", "Cracked beam", "Loose rail", "Damp wall"] },
    { name: "Floor", items: ["Basement", "Ground", "First", "Roof"] },
  ],
  solution: [
    ["Sarah", "Fire door", "Roof"],
    ["Marcus", "Cracked beam", "First"],
    ["Tom", "Damp wall", "Ground"],
    ["Priya", "Loose rail", "Basement"],
  ],
  clues: [
    { content: "The site report logs the Loose rail in the Basement.", rule: { kind: "is", a: "Basement", b: "Loose rail" } },
    { content: "I was on the Ground floor.", speaker: "Tom", rule: { kind: "is", a: "Ground", b: "Tom" } },
    { content: "I never went up to First.", speaker: "Sarah", rule: { kind: "isNot", a: "Sarah", b: "First" } },
    { content: "I spent the day in the Basement.", speaker: "Priya", rule: { kind: "is", a: "Basement", b: "Priya" } },
    { content: "Tom's find was the Damp wall.", speaker: "Marcus", rule: { kind: "is", a: "Tom", b: "Damp wall" } },
    { content: "The Cracked beam I found was on First.", speaker: "Marcus", rule: { kind: "is", a: "Cracked beam", b: "First" } },
  ],
} satisfies Content;
