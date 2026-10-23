import { describe, expect, it } from "vitest";
import { combinations, countSolutions } from "./engine";
import { deriveClues } from "./derive";
import { ambiguous, payload } from "./fixture";

describe("combinations", () => {
  it("lists the digit sets a sum allows", () => {
    expect(combinations(2, 16)).toEqual([[7, 9]]);
    expect(combinations(3, 7)).toEqual([[1, 2, 4]]);
    expect(combinations(3, 10)).toEqual([
      [1, 2, 7],
      [1, 3, 6],
      [1, 4, 5],
      [2, 3, 5],
    ]);
    expect(combinations(9, 45)).toEqual([[1, 2, 3, 4, 5, 6, 7, 8, 9]]);
  });

  it("is empty for an impossible sum", () => {
    expect(combinations(2, 2)).toEqual([]);
    expect(combinations(2, 18)).toEqual([]);
  });
});

describe("countSolutions", () => {
  it("counts one solution for a unique puzzle", () => {
    expect(countSolutions(payload)).toBe(1);
  });

  it("stops at the limit for a puzzle with two solutions", () => {
    const twin = {
      cells: ambiguous.map(({ row, col }) => ({ row, col })),
      clues: deriveClues(ambiguous),
    };
    expect(countSolutions(twin, 5)).toBe(2);
    expect(countSolutions(twin, 1)).toBe(1);
  });

  it("counts none for contradictory clues", () => {
    const clues = payload.clues.map((clue) =>
      clue.direction === "down" && clue.col === 2 ? { ...clue, sum: 3 } : clue,
    );
    expect(countSolutions({ cells: payload.cells, clues })).toBe(0);
  });

  it("counts none when a cell has no run", () => {
    expect(
      countSolutions({
        cells: [...payload.cells, { row: 4, col: 4 }],
        clues: payload.clues,
      }),
    ).toBe(0);
  });
});
