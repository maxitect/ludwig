import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/napkin-maths/schema";

export const meta = {
  slug: "bar-tab",
  title: "Bar Tab",
  difficulty: 3,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  workings:
    "4p + 2c = 20 and 2p + 3c = 13. Halve the first: 2p + c = 10. Subtract that from the second: 2c = 3, so c = 1.5 and p = 4.25. Check: 4 x 4.25 + 2 x 1.5 = 20 and 2 x 4.25 + 3 x 1.5 = 13. The two equations are independent (determinant 4 x 3 - 2 x 2 = 8), so the answer is unique.",
} satisfies ContentMeta;

export const content = {
  questionText:
    "The napkin is a bar tab. How much, in pounds, is one packet of crisps?",
  answer: "1.5",
  lines: [
    "Tab for the table by the window",
    "4 pints + 2 crisps = 20.00",
    "2 pints + 3 crisps = 13.00",
    "same price for every pint",
  ],
} satisfies Content;
