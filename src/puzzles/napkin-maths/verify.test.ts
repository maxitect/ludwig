import { describe, expect, it } from "vitest";
import { contentSchema, type Content } from "./schema";
import { verifyNapkinMaths } from "./verify";

const content: Content = {
  questionText: "What is x?",
  answer: "4",
  lines: ["x + 1 = 5", "x is a whole number"],
};
const workings = "x = 5 - 1 = 4";

describe("verifyNapkinMaths", () => {
  it("accepts two or more lines, an answer and workings", () => {
    expect(() => verifyNapkinMaths(content, { workings })).not.toThrow();
  });

  it("rejects fewer than two lines", () => {
    expect(contentSchema.safeParse({ ...content, lines: ["x + 1 = 5"] }).success).toBe(false);
    expect(() =>
      verifyNapkinMaths({ ...content, lines: ["x + 1 = 5"] }, { workings }),
    ).toThrow("at least 2 lines");
  });

  it("rejects a missing or blank answer", () => {
    const { answer: _answer, ...withoutAnswer } = content;
    expect(contentSchema.safeParse(withoutAnswer).success).toBe(false);
    expect(contentSchema.safeParse({ ...content, answer: "four" }).success).toBe(false);
    expect(() => verifyNapkinMaths({ ...content, answer: " " }, { workings })).toThrow("answer");
  });

  it("rejects missing or blank workings", () => {
    expect(() => verifyNapkinMaths(content, {})).toThrow("workings");
    expect(() => verifyNapkinMaths(content, { workings: " " })).toThrow("workings");
  });

  it("holds the question and lines to the database length checks", () => {
    expect(contentSchema.safeParse({ ...content, questionText: "q".repeat(300) }).success).toBe(true);
    expect(contentSchema.safeParse({ ...content, questionText: "q".repeat(301) }).success).toBe(false);
    expect(contentSchema.safeParse({ ...content, lines: ["x".repeat(120), "y"] }).success).toBe(true);
    expect(contentSchema.safeParse({ ...content, lines: ["x".repeat(121), "y"] }).success).toBe(false);
    expect(contentSchema.safeParse({ ...content, lines: ["", "y"] }).success).toBe(false);
  });

  it("rejects a blank line", () => {
    expect(() =>
      verifyNapkinMaths({ ...content, lines: ["x + 1 = 5", " "] }, { workings }),
    ).toThrow("blank");
  });
});
