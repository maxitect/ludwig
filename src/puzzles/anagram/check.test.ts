import { describe, expect, it } from "vitest";
import { check } from "./check";

const payload = { definitionHint: null, tiles: [], wordLengths: [] };
const run = (solution: string, answer: string) =>
  check(payload, solution, { answer }).correct;

describe("check", () => {
  it("accepts the answer", () => {
    expect(run("lantern", "lantern")).toBe(true);
  });

  it("ignores case and spaces", () => {
    expect(run("ink and paper", "InkAndPaper")).toBe(true);
    expect(run("ink and paper", "ink and paper")).toBe(true);
    expect(run("ink and paper", "INK  AND PAPER")).toBe(true);
  });

  it("rejects every single-letter swap", () => {
    const answer = "lantern";
    for (let i = 0; i < answer.length - 1; i++) {
      const letters = [...answer];
      [letters[i], letters[i + 1]] = [letters[i + 1], letters[i]];
      const swapped = letters.join("");
      if (swapped !== answer) expect(run(answer, swapped)).toBe(false);
    }
  });

  it("rejects a missing or extra letter", () => {
    expect(run("lantern", "lanter")).toBe(false);
    expect(run("lantern", "lanterns")).toBe(false);
  });
});
