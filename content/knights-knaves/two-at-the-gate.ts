import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/knights-knaves/schema";

export const meta = {
  slug: "two-at-the-gate",
  title: "Two at the Gate",
  difficulty: 1,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  questionText:
    "Two guards stand at the gate. Each is a knight, who always tells the truth, or a knave, who always lies. What is each one?",
  characters: [
    {
      name: "Aldous",
      role: "knave",
      statements: [
        {
          content: "We are both knaves.",
          claim: {
            kind: "all",
            of: [
              { kind: "is", who: "Aldous", role: "knave" },
              { kind: "is", who: "Bryn", role: "knave" },
            ],
          },
        },
      ],
    },
    {
      name: "Bryn",
      role: "knight",
      statements: [
        {
          content: "Aldous is a knave.",
          claim: { kind: "is", who: "Aldous", role: "knave" },
        },
      ],
    },
  ],
} satisfies Content;
