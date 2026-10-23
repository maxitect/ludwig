import { describe, expect, it } from "vitest";
import { payload } from "./fixture";
import { verifyFillomino } from "./verify";

describe("verifyFillomino", () => {
  it("accepts a puzzle with one solution", () => {
    expect(() => verifyFillomino(payload)).not.toThrow();
  });

  it("rejects two givens on one cell", () => {
    expect(() =>
      verifyFillomino({
        ...payload,
        givens: [...payload.givens, { row: 0, col: 3, digit: 4 }],
      }),
    ).toThrow(/duplicate given/);
  });

  it("rejects a puzzle with more than one solution", () => {
    expect(() =>
      verifyFillomino({ ...payload, givens: payload.givens.slice(0, 3) }),
    ).toThrow(/more than one solution/);
  });

  it("rejects a puzzle with no solution", () => {
    expect(() =>
      verifyFillomino({
        ...payload,
        givens: [
          { row: 0, col: 0, digit: 1 },
          { row: 0, col: 1, digit: 1 },
        ],
      }),
    ).toThrow(/no solution/);
  });
});
