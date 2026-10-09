import { describe, expect, it } from "vitest";
import { contentSchema, type Content } from "./schema";
import { verifyOddOneOut } from "./verify";

const content: Content = {
  promptText: "Which is the odd one out?",
  items: ["Violin", "Cello", "Trumpet", "Harp"],
  solution: { itemPosition: 2, explanation: "The trumpet is brass." },
};
const reviewNote = "The others are all stringed instruments.";

describe("verifyOddOneOut", () => {
  it("accepts four or five items with a solution, an explanation and a review note", () => {
    expect(() => verifyOddOneOut(content, { reviewNote })).not.toThrow();
    expect(() =>
      verifyOddOneOut({ ...content, items: [...content.items, "Viola"] }, { reviewNote }),
    ).not.toThrow();
  });

  it("rejects fewer than four and more than five items", () => {
    expect(() =>
      verifyOddOneOut({ ...content, items: content.items.slice(0, 3) }, { reviewNote }),
    ).toThrow("needs 4 or 5 items");
    expect(() =>
      verifyOddOneOut({ ...content, items: [...content.items, "Viola", "Lute"] }, { reviewNote }),
    ).toThrow("needs 4 or 5 items");
    expect(contentSchema.safeParse({ ...content, items: content.items.slice(0, 3) }).success).toBe(false);
    expect(contentSchema.safeParse({ ...content, items: [...content.items, "Viola", "Lute"] }).success).toBe(false);
  });

  it("rejects an odd item that is not one of the items", () => {
    expect(() =>
      verifyOddOneOut({ ...content, solution: { ...content.solution, itemPosition: 4 } }, { reviewNote }),
    ).toThrow("not one of the 4 items");
  });

  it("rejects a blank explanation", () => {
    expect(() =>
      verifyOddOneOut({ ...content, solution: { ...content.solution, explanation: "  " } }, { reviewNote }),
    ).toThrow("explanation is empty");
  });

  it("rejects a missing or blank review note", () => {
    expect(() => verifyOddOneOut(content, {})).toThrow("reviewNote");
    expect(() => verifyOddOneOut(content, { reviewNote: " " })).toThrow("reviewNote");
  });

  it("rejects repeated labels", () => {
    expect(() =>
      verifyOddOneOut({ ...content, items: ["A", "B", "C", "A"] }, { reviewNote }),
    ).toThrow("share a label");
  });

  it("allows one solution only: a second solution key is not content", () => {
    expect(
      contentSchema.safeParse({ ...content, solutions: [content.solution] }).success,
    ).toBe(false);
  });
});
