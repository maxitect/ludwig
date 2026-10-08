import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/knights-knaves/schema";

export const meta = {
  slug: "long-table",
  title: "Long Table",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  questionText:
    "Three diners sit at the long table. Each is a knight, who always tells the truth, or a knave, who always lies. Who is which?",
  characters: [
    {
      name: "Cora",
      role: "knight",
      statements: [
        {
          content: "Exactly one of us is a knight.",
          claim: { kind: "exactly", role: "knight", n: 1 },
        },
      ],
    },
    {
      name: "Dev",
      role: "knave",
      statements: [
        {
          content: "Cora is a knave.",
          claim: { kind: "is", who: "Cora", role: "knave" },
        },
      ],
    },
    {
      name: "Edda",
      role: "knave",
      statements: [
        {
          content: "Dev and I are different kinds.",
          claim: { kind: "different", a: "Dev", b: "Edda" },
        },
      ],
    },
  ],
} satisfies Content;
