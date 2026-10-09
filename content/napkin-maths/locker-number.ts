import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/napkin-maths/schema";

export const meta = {
  slug: "locker-number",
  title: "Locker Number",
  difficulty: 2,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  workings:
    "a + b = 15 and a - b = 3 give a = (15 + 3) / 2 = 9 and b = (15 - 3) / 2 = 6, so the product is 54. The two linear equations are independent, so the pair is unique.",
} satisfies ContentMeta;

export const content = {
  questionText:
    "John scribbled the locker number as a puzzle. What is the number?",
  answer: "54",
  lines: [
    "locker number = a x b",
    "a + b = 15",
    "a - b = 3",
    "no carrying, no tricks",
  ],
} satisfies Content;
