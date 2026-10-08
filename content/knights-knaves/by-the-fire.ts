import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/knights-knaves/schema";

export const meta = {
  slug: "by-the-fire",
  title: "By the Fire",
  difficulty: 3,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  questionText:
    "Four travellers share a fire. Each is a knight, who always tells the truth, or a knave, who always lies. Decide who is which.",
  characters: [
    {
      name: "Ivo",
      role: "knight",
      statements: [
        { content: "At least two of us are knaves.", claim: { kind: "atLeast", role: "knave", n: 2 } },
      ],
    },
    {
      name: "Jude",
      role: "knave",
      statements: [
        { content: "Ivo and Kit are different kinds.", claim: { kind: "different", a: "Ivo", b: "Kit" } },
      ],
    },
    {
      name: "Kit",
      role: "knight",
      statements: [
        { content: "Lark is a knave.", claim: { kind: "is", who: "Lark", role: "knave" } },
      ],
    },
    {
      name: "Lark",
      role: "knave",
      statements: [
        { content: "Ivo and Jude are the same kind.", claim: { kind: "same", a: "Ivo", b: "Jude" } },
      ],
    },
  ],
} satisfies Content;
