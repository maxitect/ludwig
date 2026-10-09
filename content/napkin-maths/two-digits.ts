import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/napkin-maths/schema";

export const meta = {
  slug: "two-digits",
  title: "Two Digits",
  difficulty: 4,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  workings:
    "n = 10a + b with a + b = 11. The reversal 10b + a is n + 27, so 9(b - a) = 27 and b - a = 3. With a + b = 11: b = 7, a = 4, n = 47. Check: 74 - 47 = 27. The two equations in a and b are independent, so n is unique.",
} satisfies ContentMeta;

export const content = {
  questionText: "A two-digit number is hidden in the workings. What is it?",
  answer: "47",
  lines: [
    "n = 10a + b",
    "a + b = 11",
    "reverse it: 10b + a",
    "reversed is 27 more than n",
  ],
} satisfies Content;
