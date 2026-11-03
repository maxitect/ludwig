import { describe, expect, it } from "vitest";
import { check } from "./check";
import { payload, solution } from "./fixture";

describe("check", () => {
  it("accepts the solution", () => {
    expect(check(payload, solution, { mirrors: solution })).toEqual({
      correct: true,
      wrongParts: [],
    });
  });

  it("rejects each slot flipped, and names only ports", () => {
    for (const [index, placed] of solution.entries()) {
      const mirrors = solution.map((mirror, at) =>
        at === index
          ? {
              ...mirror,
              mirror:
                placed.mirror === "slash"
                  ? ("backslash" as const)
                  : ("slash" as const),
            }
          : mirror,
      );
      const result = check(payload, solution, { mirrors });
      expect(result.correct).toBe(false);
      for (const part of result.wrongParts) {
        expect(Object.keys(part).sort()).toEqual(["offset", "side"]);
      }
    }
  });

  it("rejects an empty slot, a mirror outside the slots and a repeated cell", () => {
    expect(
      check(payload, solution, { mirrors: solution.slice(1) }).correct,
    ).toBe(false);
    expect(
      check(payload, solution, {
        mirrors: [...solution, { row: 3, col: 3, mirror: "slash" }],
      }).correct,
    ).toBe(false);
    expect(
      check(payload, solution, {
        mirrors: [...solution, solution[0]],
      }).correct,
    ).toBe(false);
  });

  it("does not depend on the solution it is given", () => {
    expect(check(payload, [], { mirrors: solution }).correct).toBe(true);
    expect(check(payload, solution, { mirrors: [] }).correct).toBe(false);
  });
});
