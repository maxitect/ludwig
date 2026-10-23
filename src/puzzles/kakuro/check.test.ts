import { describe, expect, it } from "vitest";
import { check, checkCell, revealCell } from "./check";
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

describe("checkCell and revealCell", () => {
  it("judges one cell", () => {
    expect(checkCell(payload, solution, 1, 2, "3")).toEqual({ correct: true });
    expect(checkCell(payload, solution, 1, 2, "4")).toEqual({ correct: false });
    expect(checkCell(payload, solution, 0, 0, "1")).toEqual({ correct: false });
  });

  it("reveals one digit, or null on a black cell", () => {
    expect(revealCell(solution, 2, 1)).toBe("2");
    expect(revealCell(solution, 0, 0)).toBeNull();
  });
});
