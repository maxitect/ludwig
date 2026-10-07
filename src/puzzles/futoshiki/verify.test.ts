import { describe, expect, it } from "vitest";
import { payload } from "./fixture";
import { verifyFutoshiki } from "./verify";

describe("verifyFutoshiki", () => {
  it("accepts a puzzle with exactly one solution", () => {
    expect(() => verifyFutoshiki(payload)).not.toThrow();
  });

  it("rejects a puzzle with more than one solution", () => {
    const loosened = {
      ...payload,
      inequalities: payload.inequalities.filter(
        ({ row, col, direction }) =>
          !(row === 1 && col === 2 && direction === "right"),
      ),
    };
    expect(() => verifyFutoshiki(loosened)).toThrow(/more than one solution/);
  });

  it("rejects a puzzle with no solution", () => {
    expect(() =>
      verifyFutoshiki({
        ...payload,
        inequalities: [
          ...payload.inequalities.filter(
            ({ row, col, direction }) =>
              !(row === 3 && col === 2 && direction === "right"),
          ),
          { row: 3, col: 2, direction: "right", relation: "lt" },
        ],
      }),
    ).toThrow(/no solution/);
  });

  it("rejects two givens on one cell", () => {
    expect(() =>
      verifyFutoshiki({
        ...payload,
        givens: [...payload.givens, { row: 0, col: 0, digit: 2 }],
      }),
    ).toThrow(/duplicate given at row 1, column 1/);
  });

  it("rejects two signs on one cell edge", () => {
    expect(() =>
      verifyFutoshiki({
        ...payload,
        inequalities: [
          ...payload.inequalities,
          { row: 0, col: 1, direction: "right", relation: "gt" },
        ],
      }),
    ).toThrow(/duplicate inequality right of row 1, column 2/);
  });
});
