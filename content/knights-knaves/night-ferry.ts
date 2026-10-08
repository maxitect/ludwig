import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/knights-knaves/schema";

export const meta = {
  slug: "night-ferry",
  title: "Night Ferry",
  difficulty: 4,
  publishedAt: new Date("2026-10-08T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  questionText:
    "Five passengers cross on the night ferry. Each is a knight, who always tells the truth, or a knave, who always lies. Who is who?",
  characters: [
    {
      name: "Mara",
      role: "knight",
      statements: [
        {
          content: "Odile and Nico are different kinds.",
          claim: { kind: "different", a: "Odile", b: "Nico" },
        },
      ],
    },
    {
      name: "Nico",
      role: "knight",
      statements: [
        {
          content: "Exactly three of us are knights.",
          claim: { kind: "exactly", role: "knight", n: 3 },
        },
      ],
    },
    {
      name: "Odile",
      role: "knave",
      statements: [
        {
          content: "Quin is a knave.",
          claim: { kind: "is", who: "Quin", role: "knave" },
        },
      ],
    },
    {
      name: "Pip",
      role: "knave",
      statements: [
        {
          content: "Mara and Odile are the same kind.",
          claim: { kind: "same", a: "Mara", b: "Odile" },
        },
      ],
    },
    {
      name: "Quin",
      role: "knight",
      statements: [
        {
          content: "Nico is a knight.",
          claim: { kind: "is", who: "Nico", role: "knight" },
        },
      ],
    },
  ],
} satisfies Content;
