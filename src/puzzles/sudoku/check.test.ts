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

  it("lists only cells whose digit repeats in a unit, never a diff against the solution", () => {
    const answer = perturb(0, 2, 1);
    const { wrongParts } = check(payload, solution, answer);
    const digitAt = (r: number, c: number) =>
      answer.cells.find(({ row, col }) => row === r && col === c)!.digit;
    const sharesUnit = (a: { row: number; col: number }, b: typeof a) =>
      a.row === b.row ||
      a.col === b.col ||
      (Math.floor(a.row / 3) === Math.floor(b.row / 3) &&
        Math.floor(a.col / 3) === Math.floor(b.col / 3));
    const repeats = (cell: { row: number; col: number }) =>
      answer.cells.some(
        (other) =>
          (other.row !== cell.row || other.col !== cell.col) &&
          sharesUnit(cell, other) &&
          other.digit === digitAt(cell.row, cell.col),
      );
    expect(wrongParts.length).toBeGreaterThan(1);
    for (const cell of wrongParts) expect(repeats(cell)).toBe(true);
    const partners = wrongParts.filter(
      ({ row, col }) => !(row === 0 && col === 2),
    );
    expect(partners.length).toBeGreaterThan(0);
    for (const { row, col } of partners) {
      expect(digitAt(row, col)).toBe(
        solution.find((cell) => cell.row === row && cell.col === col)!.digit,
      );
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
