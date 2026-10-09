import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/napkin-maths/schema";

export const meta = {
  slug: "ink-pots",
  title: "Ink Pots",
  difficulty: 2,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  workings:
    "P / 3 + 4 = P / 2 gives 4 = P / 2 - P / 3 = P / 6, so P = 24. Check: 8 + 4 = 12 = 24 / 2. The equation is linear in P with a non-zero coefficient, so P is unique.",
} satisfies ContentMeta;

export const content = {
  questionText: "How many ink pots are in the cupboard?",
  answer: "24",
  lines: [
    "P pots in all",
    "a third of P, and 4 more",
    "is the same as half of P",
  ],
} satisfies Content;
