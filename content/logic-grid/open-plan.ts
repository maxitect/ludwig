import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "open-plan",
  title: "Open Plan",
  difficulty: 1,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
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
    { content: "Basement and Loose rail share a line of the report.", rule: { kind: "is", a: "Basement", b: "Loose rail" } },
    { content: "The report ties Ground to Tom.", rule: { kind: "is", a: "Ground", b: "Tom" } },
    { content: "Sarah and First never share a line of the report.", rule: { kind: "isNot", a: "Sarah", b: "First" } },
    { content: "Whatever else is true, Basement goes with Priya.", rule: { kind: "is", a: "Basement", b: "Priya" } },
    { content: "Tom and Damp wall share a line of the report.", rule: { kind: "is", a: "Tom", b: "Damp wall" } },
    { content: "The report ties Cracked beam to First.", rule: { kind: "is", a: "Cracked beam", b: "First" } },
  ],
} satisfies Content;
