import { describe, expect, it } from "vitest";
import {
  conflictingIndexes,
  countSolutions,
  gridFromGivens,
  solve,
} from "./engine";
import { givens, solution } from "./fixture";

describe("sudoku engine", () => {
  it("counts exactly one solution for a unique puzzle", () => {
    expect(countSolutions(givens)).toBe(1);
  });

  it("solves a unique puzzle to its known grid", () => {
    expect(solve(givens)).toEqual(solution);
  });

  it("counts 2 when a given is removed and the puzzle becomes ambiguous", () => {
    const loosened = givens.filter(({ row, col }) => row !== 2 || col !== 2);
    expect(countSolutions(loosened)).toBe(2);
  });

  it("counts 0 when two givens repeat a digit in a row", () => {
    expect(countSolutions([...givens, { row: 0, col: 8, digit: 5 }])).toBe(0);
    expect(solve([...givens, { row: 0, col: 8, digit: 5 }])).toBeNull();
  });

  it("counts 0 when a cell is left with no candidate", () => {
    const contradictory = [
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((digit, col) => ({
        row: 0,
        col,
        digit,
      })),
      { row: 1, col: 8, digit: 9 },
    ];
    expect(countSolutions(contradictory)).toBe(0);
  });

  it("stops counting at the limit", () => {
    expect(countSolutions([], 2)).toBe(2);
    expect(countSolutions([], 5)).toBe(5);
  });

  it("finds the cells that share a digit with a peer", () => {
    const grid = gridFromGivens([
      { row: 0, col: 0, digit: 4 },
      { row: 0, col: 5, digit: 4 },
      { row: 5, col: 0, digit: 4 },
      { row: 1, col: 1, digit: 4 },
      { row: 4, col: 4, digit: 4 },
    ]);
    expect([...conflictingIndexes(grid)].sort((a, b) => a - b)).toEqual([
      0, 5, 10, 45,
    ]);
  });
});
