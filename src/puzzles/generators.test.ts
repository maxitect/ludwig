import { describe, expect, it } from "vitest";
import { gradeContent, regenerate } from "./generators";

describe("regenerate", () => {
  it("replays a generator by name, version, seed and difficulty", () => {
    const provenance = { generator: "futoshiki", version: 1, seed: "x" };
    expect(regenerate(provenance, 2)).toEqual(regenerate(provenance, 2));
    expect(gradeContent("futoshiki", regenerate(provenance, 2).content)).toMatchObject({
      difficulty: 2,
    });
  });

  it("throws on an unknown generator, version or difficulty", () => {
    expect(() =>
      regenerate({ generator: "nope", version: 1, seed: "x" }, 2),
    ).toThrow(/Unknown generator/);
    expect(() =>
      regenerate({ generator: "sudoku", version: 99, seed: "x" }, 2),
    ).toThrow(/Unknown sudoku generator version: 99/);
    expect(() =>
      regenerate({ generator: "sudoku", version: 1, seed: "x" }, 6),
    ).toThrow(/difficulty/);
  });
});
