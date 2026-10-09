import { describe, expect, it } from "vitest";
import { check } from "./check";
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
      wrongParts: [],
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
    expect(result.wrongParts).toContainEqual({ row: 0, col: 2 });
  });

  it("lists only cells in a unit with the broken rule, not cells that merely differ from the solution", () => {
    const { wrongParts } = check(payload, solution, perturb(0, 2, 1));
    const clash = solution.find(
      ({ row, col, digit }) => digit === 1 && (row === 0 || col === 2),
    );
    expect(clash).toBeDefined();
    expect(wrongParts.length).toBeLessThan(10);
    for (const { row, col } of wrongParts) {
      const sameUnit =
        row === 0 ||
        col === 2 ||
        (Math.floor(row / 3) === 0 && Math.floor(col / 3) === 0);
      expect(sameUnit).toBe(true);
    }
  });

  it("reports an overwritten given", () => {
    const result = check(payload, solution, perturb(0, 0, 9));
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toContainEqual({ row: 0, col: 0 });
  });

  it("rejects an empty cell", () => {
    const result = check(payload, solution, {
      cells: solution.slice(0, 80),
    });
    expect(result).toMatchObject({
      correct: false,
      wrongParts: [{ row: 8, col: 8 }],
    });
  });
});
