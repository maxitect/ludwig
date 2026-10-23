import { describe, expect, it } from "vitest";
import { check } from "./check";
import { payload, solution } from "./fixture";

describe("check", () => {
  it("accepts the solution", () => {
    expect(check(payload, solution, { cells: solution })).toEqual({
      correct: true,
    });
  });

  it.each(solution.map((_, index) => index))(
    "rejects a wrong digit in cell %i",
    (index) => {
      const cells = solution.map((cell, i) =>
        i === index ? { ...cell, digit: (cell.digit % 9) + 1 } : cell,
      );
      expect(check(payload, solution, { cells }).correct).toBe(false);
    },
  );

  it("rejects a missing cell and a digit on a black cell", () => {
    expect(check(payload, solution, { cells: solution.slice(1) }).correct).toBe(
      false,
    );
    expect(
      check(payload, solution, {
        cells: [...solution.slice(1), { row: 0, col: 0, digit: 1 }],
      }).correct,
    ).toBe(false);
  });
});
