import { describe, expect, it } from "vitest";
import { verifyAnagram } from "./verify";

describe("verifyAnagram", () => {
  it("accepts content whose scramble is a different permutation", () => {
    expect(() =>
      verifyAnagram({
        answer: "ink and paper",
        definitionHint: null,
        scrambleSeed: 1904,
      }),
    ).not.toThrow();
  });

  it("rejects an answer that cannot be scrambled", () => {
    expect(() =>
      verifyAnagram({ answer: "aaa", definitionHint: null, scrambleSeed: 1 }),
    ).toThrow("No distinct scramble");
  });
});
