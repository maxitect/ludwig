import { describe, expect, it } from "vitest";
import { givens } from "./fixture";
import { verifySudoku } from "./verify";

describe("verifySudoku", () => {
  it("accepts a puzzle with exactly one solution", () => {
    expect(() => verifySudoku({ givens })).not.toThrow();
  });

  it("rejects a puzzle with more than one solution", () => {
    const loosened = givens.filter(({ row, col }) => row !== 2 || col !== 2);
    expect(() => verifySudoku({ givens: loosened })).toThrow(
      /more than one solution/,
    );
  });

  it("rejects a puzzle with no solution", () => {
    expect(() =>
      verifySudoku({ givens: [...givens, { row: 0, col: 8, digit: 5 }] }),
    ).toThrow(/no solution/);
  });

  it("rejects two givens on one cell", () => {
    expect(() =>
      verifySudoku({ givens: [...givens, { row: 0, col: 0, digit: 5 }] }),
    ).toThrow(/duplicate given at row 1, column 1/);
  });
});
