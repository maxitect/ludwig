import { describe, expect, it } from "vitest";
import {
  areas,
  brokenIndexes,
  countSolutions,
  gridFromGivens,
  solve,
} from "./engine";
import { payload, solution } from "./fixture";

const layout = { rows: 6, cols: 6 };

describe("areas", () => {
  it("finds the edge-connected groups of equal digits and skips empty cells", () => {
    const grid = Array(36).fill(0);
    [1, 2, 2, 0, 3, 3].forEach((digit, index) => (grid[index] = digit));
    grid[10] = 3;
    expect(
      areas(layout, grid).map(({ digit, cells }) => [digit, cells.length]),
    ).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it("joins digits only along edges, never diagonally", () => {
    const grid = Array(36).fill(0);
    grid[0] = 4;
    grid[7] = 4;
    expect(areas(layout, grid)).toHaveLength(2);
  });
});

describe("brokenIndexes", () => {
  it("is empty for the solved grid", () => {
    expect(
      brokenIndexes(
        layout,
        solution.map(({ digit }) => digit),
      ).size,
    ).toBe(0);
  });

  it("names both of two touching areas of size 3, which merge into one of 6", () => {
    const grid = solution.map(({ digit }) => digit);
    const merged = [0, 1, 6, 7, 12, 13];
    for (const index of merged) grid[index] = 3;
    const found = brokenIndexes(layout, grid);
    for (const index of merged) expect(found.has(index)).toBe(true);
  });

  it("names an area too small to grow because it is walled in", () => {
    const grid = Array(36).fill(0);
    grid[0] = 3;
    grid[1] = 1;
    grid[6] = 1;
    expect(brokenIndexes(layout, grid)).toEqual(new Set([0]));
  });

  it("leaves a small area alone while it can still grow", () => {
    const grid = Array(36).fill(0);
    grid[0] = 3;
    expect(brokenIndexes(layout, grid).size).toBe(0);
  });
});

describe("countSolutions", () => {
  it("counts exactly one for the fixture and finds the stored grid", () => {
    expect(countSolutions(payload)).toBe(1);
    expect(solve(payload)).toEqual(solution);
  });

  it("counts two (capped) when the givens leave room for more", () => {
    const loose = { ...payload, givens: payload.givens.slice(0, 3) };
    expect(countSolutions(loose, 2)).toBe(2);
    expect(countSolutions(loose, 5)).toBeGreaterThan(2);
  });

  it("counts none for contradictory givens", () => {
    const touching = {
      ...layout,
      givens: [
        { row: 0, col: 0, digit: 1 },
        { row: 0, col: 1, digit: 1 },
      ],
    };
    expect(countSolutions(touching)).toBe(0);
    expect(solve(touching)).toBeNull();
  });

  it("counts none when a given can never reach its size", () => {
    const stuck = {
      rows: 5,
      cols: 5,
      givens: [
        { row: 0, col: 0, digit: 9 },
        { row: 0, col: 1, digit: 1 },
        { row: 1, col: 0, digit: 1 },
      ],
    };
    expect(countSolutions(stuck)).toBe(0);
  });
});

describe("gridFromGivens", () => {
  it("places the givens row-major", () => {
    const grid = gridFromGivens(layout, [{ row: 1, col: 2, digit: 7 }]);
    expect(grid[8]).toBe(7);
    expect(grid.filter(Boolean)).toHaveLength(1);
  });
});
