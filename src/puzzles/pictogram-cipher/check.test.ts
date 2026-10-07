import { describe, expect, it } from "vitest";
import { check } from "./check";
import type { Payload, Solution } from "./schema";

const payload: Payload = {
  words: [
    ["glyph-01", "glyph-02"],
    ["glyph-03", "glyph-02"],
  ],
  given: [],
};
const solution: Solution = {
  words: [
    ["h", "e"],
    ["h", "e"],
  ],
};

const correct = (answer: string) =>
  check(payload, solution, { answer }).correct;

describe("check", () => {
  it("accepts the plaintext", () => {
    expect(correct("he he")).toBe(true);
  });

  it("ignores case, spacing and punctuation", () => {
    expect(correct("HE, HE!")).toBe(true);
    expect(correct("hehe")).toBe(true);
    expect(correct("  h e   h e ")).toBe(true);
  });

  it("rejects a changed, missing or extra letter", () => {
    expect(correct("he ha")).toBe(false);
    expect(correct("he h")).toBe(false);
    expect(correct("he hee")).toBe(false);
  });

  it("rejects a half-guessed answer", () => {
    expect(correct("he h_")).toBe(false);
  });
});
