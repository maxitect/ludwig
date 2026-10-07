import { describe, expect, it } from "vitest";
import {
  conflictingIndexes,
  countSolutions,
  orderedPairs,
  solve,
} from "./engine";
import { payload, solution } from "./fixture";

describe("futoshiki engine", () => {
  it("counts exactly one solution for a unique puzzle", () => {
    expect(countSolutions(payload)).toBe(1);
  });

  it("solves a unique puzzle to its known grid", () => {
    expect(solve(payload)).toEqual(solution);
  });

  it("counts 2 when an inequality is removed and the puzzle becomes ambiguous", () => {
    const loosened = {
      ...payload,
      inequalities: payload.inequalities.filter(
        ({ row, col, direction }) =>
          !(row === 1 && col === 2 && direction === "right"),
      ),
    };
    expect(countSolutions(loosened)).toBe(2);
    expect(countSolutions(loosened, 5)).toBe(2);
  });

  it("counts 0 for a contradictory puzzle", () => {
    const contradictory = {
      ...payload,
      inequalities: [
        ...payload.inequalities,
        { row: 3, col: 2, direction: "right", relation: "lt" } as const,
      ],
    };
    expect(countSolutions(contradictory)).toBe(0);
    expect(solve(contradictory)).toBeNull();
  });

  it("counts 0 when a given breaks a sign with another given", () => {
    const clashing = {
      size: 4,
      givens: [
        { row: 0, col: 0, digit: 3 },
        { row: 0, col: 1, digit: 2 },
      ],
      inequalities: [
        { row: 0, col: 0, direction: "right", relation: "lt" } as const,
      ],
    };
    expect(countSolutions(clashing)).toBe(0);
  });

  it("counts 0 when two givens repeat a digit in a column", () => {
    expect(
      countSolutions({
        size: 4,
        givens: [
          { row: 0, col: 1, digit: 2 },
          { row: 3, col: 1, digit: 2 },
        ],
        inequalities: [],
      }),
    ).toBe(0);
  });

  it("counts every 4 by 4 Latin square when nothing constrains it", () => {
    expect(countSolutions({ size: 4, givens: [], inequalities: [] }, 1000)).toBe(
      576,
    );
  });

  it("handles a 7 by 7 grid", () => {
    const found = solve({ size: 7, givens: [], inequalities: [] });
    expect(found).toHaveLength(49);
    expect(new Set(found?.slice(0, 7).map(({ digit }) => digit)).size).toBe(7);
  });

  it("orients each sign from the smaller cell to the larger", () => {
    expect(
      orderedPairs(4, [
        { row: 0, col: 0, direction: "right", relation: "lt" },
        { row: 0, col: 0, direction: "right", relation: "gt" },
        { row: 1, col: 2, direction: "down", relation: "lt" },
        { row: 1, col: 2, direction: "down", relation: "gt" },
      ]),
    ).toEqual([
      [0, 1],
      [1, 0],
      [6, 10],
      [10, 6],
    ]);
  });

  it("finds repeated digits and broken signs among filled cells only", () => {
    const grid = Array(16).fill(0);
    grid[0] = 2;
    grid[1] = 2;
    grid[4] = 3;
    expect([
      ...conflictingIndexes(4, [], grid),
    ]).toEqual([0, 1]);
    grid[1] = 0;
    expect([
      ...conflictingIndexes(
        4,
        [{ row: 0, col: 0, direction: "down", relation: "gt" }],
        grid,
      ),
    ]).toEqual([4, 0]);
  });
});
