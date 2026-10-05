import { describe, expect, it } from "vitest";
import { check, checkCell, revealCell } from "./check";
import { givens, solution } from "./fixture";
import type { Answer } from "./schema";

const payload = { givens };
const correct: Answer = { cells: solution };

const perturb = (row: number, col: number, digit: number): Answer => ({
  cells: solution.map((cell) =>
    cell.row === row && cell.col === col ? { ...cell, digit } : cell,
  ),
});

describe("sudoku check", () => {
  it("accepts the solution", () => {
    expect(check(payload, solution, correct)).toEqual({
      correct: true,
      wrongCells: [],
    });
  });

  it("accepts a valid completion without comparing it with the stored solution", () => {
    const swapped = solution.map(({ row, col, digit }) => ({
      row,
      col,
      digit: ({ 1: 2, 2: 1 } as Record<number, number>)[digit] ?? digit,
    }));
    const relabelled = givens.map(({ row, col, digit }) => ({
      row,
      col,
      digit: ({ 1: 2, 2: 1 } as Record<number, number>)[digit] ?? digit,
    }));
    expect(
      check({ givens: relabelled }, solution, { cells: swapped }).correct,
    ).toBe(true);
  });

  it("rejects a one-cell perturbation and reports the wrong cells", () => {
    const result = check(payload, solution, perturb(0, 2, 1));
    expect(result.correct).toBe(false);
    expect(result.wrongCells).toContainEqual({ row: 0, col: 2 });
  });

  it("reports an overwritten given", () => {
    const result = check(payload, solution, perturb(0, 0, 9));
    expect(result.correct).toBe(false);
    expect(result.wrongCells).toContainEqual({ row: 0, col: 0 });
  });

  it("rejects an empty cell", () => {
    const result = check(payload, solution, {
      cells: solution.slice(0, 80),
    });
    expect(result).toMatchObject({
      correct: false,
      wrongCells: [{ row: 8, col: 8 }],
    });
  });

  it("checks and reveals a single cell from the solution", () => {
    expect(checkCell(payload, solution, 0, 2, "4")).toEqual({ correct: true });
    expect(checkCell(payload, solution, 0, 2, "5")).toEqual({ correct: false });
    expect(revealCell(solution, 0, 2)).toBe("4");
    expect(revealCell(solution, 9, 9)).toBeNull();
  });
});
