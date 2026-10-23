import { describe, expect, it } from "vitest";
import { check } from "./check";
import { payload, solution } from "./fixture";
import type { Answer } from "./schema";

const withDigits = (changes: [number, number, number][]) =>
  solution.map((cell) => {
    const change = changes.find(
      ([row, col]) => row === cell.row && col === cell.col,
    );
    return change ? { ...cell, digit: change[2] } : cell;
  });

const names = (wrongParts: { row: number; col: number }[]) =>
  wrongParts.map(({ row, col }) => `${row},${col}`);

describe("fillomino check", () => {
  it("accepts the solved grid and returns no cells", () => {
    expect(check(payload, solution, { cells: solution })).toEqual({
      correct: true,
      wrongParts: [],
    });
  });

  it("rejects two touching areas of size 3 and names all six cells", () => {
    const cells = withDigits([
      [0, 0, 3],
      [0, 1, 3],
      [1, 0, 3],
      [1, 1, 3],
      [2, 0, 3],
      [2, 1, 3],
    ]);
    const { correct, wrongParts } = check(payload, solution, { cells });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toEqual(
      expect.arrayContaining(["0,0", "0,1", "1,0", "1,1", "2,0", "2,1"]),
    );
  });

  it("rejects an area that lost a cell and names the short area", () => {
    const { correct, wrongParts } = check(payload, solution, {
      cells: withDigits([[5, 5, 1]]),
    });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toEqual(
      expect.arrayContaining(["4,3", "5,0", "5,1", "5,2", "5,3", "5,4"]),
    );
  });

  it("rejects an overwritten given and names it", () => {
    const { correct, wrongParts } = check(payload, solution, {
      cells: withDigits([[0, 5, 2]]),
    });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toContain("0,5");
  });

  it("names a cell left out of the answer", () => {
    const cells: Answer["cells"] = solution.filter(
      ({ row, col }) => !(row === 5 && col === 0),
    );
    const { correct, wrongParts } = check(payload, solution, { cells });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toContain("5,0");
  });

  it("rejects every single-cell change to the solved grid", () => {
    for (const { row, col, digit } of solution) {
      for (let other = 1; other <= 9; other++) {
        if (other === digit) continue;
        const cells = withDigits([[row, col, other]]);
        expect(check(payload, solution, { cells }).correct).toBe(false);
      }
    }
  });
});
