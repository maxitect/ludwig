import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/knights-knaves/schema";

export const meta = {
  slug: "side-door",
  title: "Side Door",
  difficulty: 2,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  questionText:
    "Three people wait by the side door. Each is a knight, who always tells the truth, or a knave, who always lies. Work out who is who.",
  characters: [
    {
      name: "Fenn",
      role: "knight",
      statements: [
        {
          content: "At least two of us are knights.",
          claim: { kind: "atLeast", role: "knight", n: 2 },
        },
      ],
    },
    {
      name: "Gwen",
      role: "knave",
      statements: [
        {
          content: "Fenn is a knave.",
          claim: { kind: "is", who: "Fenn", role: "knave" },
        },
      ],
    },
    {
      name: "Hale",
      role: "knight",
      statements: [
        {
          content: "Gwen and Fenn are different kinds.",
          claim: { kind: "different", a: "Gwen", b: "Fenn" },
        },
      ],
    },
  ],
} satisfies Content;
