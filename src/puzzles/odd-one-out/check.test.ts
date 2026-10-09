import { describe, expect, it } from "vitest";
import { check } from "./check";
import type { Payload, Solution } from "./schema";

const payload: Payload = {
  promptText: "Which is the odd one out?",
  items: [0, 1, 2, 3].map((position) => ({ position, label: `Item ${position}` })),
};
const solution: Solution = { itemPosition: 2, explanation: "Because it is." };

describe("odd one out check", () => {
  it("accepts the odd item and returns the explanation", () => {
    expect(check(payload, solution, { itemPosition: 2 })).toEqual({
      correct: true,
      epilogue: "Because it is.",
    });
  });

  it.each([0, 1, 3])("rejects item %i without revealing anything", (itemPosition) => {
    const result = check(payload, solution, { itemPosition });
    expect(result).toEqual({ correct: false });
    expect(JSON.stringify(result)).not.toContain("Because");
  });

  it("rejects a position that is not an item", () => {
    expect(check(payload, solution, { itemPosition: 9 })).toEqual({
      correct: false,
    });
  });
});
