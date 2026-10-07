import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/logic-grid/schema";

export const meta = {
  slug: "waiting-room",
  title: "Waiting Room",
  difficulty: 3,
  publishedAt: new Date("2026-10-01T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
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
    { content: "Hull is not booked with Platform 5.", rule: { kind: "isNot", a: "Hull", b: "Platform 5" } },
    { content: "The timetable keeps Dana apart from Platform 4.", rule: { kind: "isNot", a: "Dana", b: "Platform 4" } },
    { content: "Bath is booked with Platform 2 or with Platform 1.", rule: { kind: "either", a: "Bath", b: "Platform 2", c: "Platform 1" } },
    { content: "Platform 4 and Rye are on different lines of the timetable.", rule: { kind: "isNot", a: "Platform 4", b: "Rye" } },
    { content: "Dana is not booked with Bath.", rule: { kind: "isNot", a: "Dana", b: "Bath" } },
    { content: "The timetable keeps Platform 5 apart from Rye.", rule: { kind: "isNot", a: "Platform 5", b: "Rye" } },
    { content: "Rye and Edda are on the same line of the timetable.", rule: { kind: "is", a: "Rye", b: "Edda" } },
    { content: "The timetable matches Ely with Bruno.", rule: { kind: "is", a: "Ely", b: "Bruno" } },
    { content: "Cyrus is booked with Bath.", isFalse: true, rule: { kind: "is", a: "Cyrus", b: "Bath" } },
    { content: "Platform 2 and Rye are on different lines of the timetable.", rule: { kind: "isNot", a: "Platform 2", b: "Rye" } },
    { content: "Platform 3 and Cyrus are on the same line of the timetable.", rule: { kind: "is", a: "Platform 3", b: "Cyrus" } },
  ],
} satisfies Content;
