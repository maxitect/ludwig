import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/napkin-maths/schema";

export const meta = {
  slug: "there-and-back",
  title: "There and Back",
  difficulty: 3,
  publishedAt: new Date("2026-10-09T00:00:00Z"),
  workings:
    "d / 60 + d / 40 = 5. Multiply by 120: 2d + 3d = 600, so d = 120. Check: 2 hours out and 3 hours back make 5. The equation is linear in d with a non-zero coefficient, so d is unique.",
} satisfies ContentMeta;

export const content = {
  questionText: "How far is the station, in miles, one way?",
  answer: "120",
  lines: [
    "out at 60 mph",
    "back at 40 mph",
    "time out + time back = 5 hours",
    "same road both ways",
  ],
} satisfies Content;
