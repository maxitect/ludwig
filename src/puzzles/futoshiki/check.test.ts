import { describe, expect, it } from "vitest";
import { check } from "./check";
import { payload, solution } from "./fixture";
import type { Answer } from "./schema";

const correct: Answer = { cells: solution };

const perturb = (row: number, col: number, digit: number): Answer => ({
  cells: solution.map((cell) =>
    cell.row === row && cell.col === col ? { ...cell, digit } : cell,
  ),
});

describe("futoshiki check", () => {
  it("accepts the solution", () => {
    expect(check(payload, solution, correct)).toEqual({
      correct: true,
      cellsWrong: [],
    });
  });

  it("accepts a valid completion without comparing it with the stored solution", () => {
    const grid = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];
    const relaxed = { ...payload, inequalities: [], givens: [] };
    const swapped: Answer = {
      cells: grid.flatMap((line, row) =>
        line.map((digit, col) => ({ row, col, digit: 5 - digit })),
      ),
    };
    expect(check(relaxed, solution, swapped).correct).toBe(true);
  });

  it("rejects a completion that breaks one inequality and names both cells", () => {
    const result = check(
      {
        ...payload,
        givens: [],
        inequalities: [
          { row: 0, col: 0, direction: "right", relation: "gt" },
        ],
      },
      solution,
      correct,
    );
    expect(result.correct).toBe(false);
    expect(result.cellsWrong).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it("names the cells of a violated sign, not the cells that differ from the solution", () => {
    const flipped = { ...payload, givens: [] };
    const answer: Answer = {
      cells: [
        [1, 2, 3, 4],
        [4, 3, 2, 1],
        [2, 1, 4, 3],
        [3, 4, 1, 2],
      ].flatMap((line, row) => line.map((digit, col) => ({ row, col, digit }))),
    };
    const result = check(flipped, solution, answer);
    expect(result.correct).toBe(false);
    expect(result.cellsWrong).toContainEqual({ row: 1, col: 0 });
    expect(result.cellsWrong).toContainEqual({ row: 1, col: 1 });
    expect(result.cellsWrong).not.toContainEqual({ row: 0, col: 0 });
  });

  it("rejects a one-cell perturbation and reports the wrong cells", () => {
    const result = check(payload, solution, perturb(0, 1, 3));
    expect(result.correct).toBe(false);
    expect(result.cellsWrong).toContainEqual({ row: 0, col: 1 });
  });

  it("reports an overwritten given", () => {
    const result = check(payload, solution, perturb(0, 0, 2));
    expect(result.correct).toBe(false);
    expect(result.cellsWrong).toContainEqual({ row: 0, col: 0 });
  });

  it("reports an empty cell", () => {
    const result = check(payload, solution, {
      cells: solution.map((cell) =>
        cell.row === 3 && cell.col === 3 ? { ...cell, digit: 0 } : cell,
      ),
    });
    expect(result.correct).toBe(false);
    expect(result.cellsWrong).toContainEqual({ row: 3, col: 3 });
  });

  it("reports a digit larger than the grid", () => {
    const result = check(payload, solution, perturb(3, 3, 5));
    expect(result.correct).toBe(false);
    expect(result.cellsWrong).toContainEqual({ row: 3, col: 3 });
  });

  it("ignores cells outside the grid and rejects a grid that is missing cells", () => {
    const outside = check(payload, solution, {
      cells: [...solution, { row: 4, col: 0, digit: 1 }],
    });
    expect(outside.correct).toBe(true);
    const short = check(payload, solution, { cells: solution.slice(1) });
    expect(short.correct).toBe(false);
    expect(short.cellsWrong).toContainEqual({ row: 0, col: 0 });
  });
});
