import { describe, expect, it } from "vitest";
import { check } from "./check";
import { decoys, payload, solution } from "./fixture";

const answer = (circles: { row: number; col: number }[]) => ({ circles });

describe("circle9 check", () => {
  it("accepts the nine circles", () => {
    expect(check(payload, solution, answer(solution))).toEqual({
      correct: true,
      wrongParts: [],
    });
  });

  it("rejects nine valid-looking circles that repeat a digit", () => {
    const repeated = {
      numbers: payload.numbers.map((number) =>
        number.row === 4 ? { ...number, digit: 1 } : number,
      ),
    };
    const rejected = check(repeated, solution, answer(solution));
    expect(rejected.correct).toBe(false);
    expect(rejected.wrongParts).toEqual([
      { row: 0, col: 0 },
      { row: 4, col: 4 },
    ]);
  });

  it("rejects a circle on an empty cell and names it", () => {
    const [, ...rest] = solution;
    const result = check(payload, solution, answer([{ row: 0, col: 1 }, ...rest]));
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual([{ row: 0, col: 1 }]);
  });

  it("rejects circles that share a row, a column or a box, and names them", () => {
    const withDecoys = { numbers: [...payload.numbers, ...decoys] };
    const sameRow = answer([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      ...solution.slice(2),
    ]);
    expect(check(withDecoys, solution, sameRow).wrongParts).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 3, col: 1 },
    ]);
  });

  it("rejects eight circles and ten circles", () => {
    expect(check(payload, solution, answer(solution.slice(1))).correct).toBe(false);
    const withDecoys = { numbers: [...payload.numbers, ...decoys] };
    const ten = answer([...solution, { row: 0, col: 1 }]);
    expect(check(withDecoys, solution, ten).correct).toBe(false);
  });

  it("rejects every single circle moved to another number", () => {
    const withDecoys = { numbers: [...payload.numbers, ...decoys] };
    for (const moved of [
      { from: 0, to: { row: 0, col: 1 } },
      { from: 3, to: { row: 3, col: 0 } },
    ]) {
      const circles = solution.map((cell, i) =>
        i === moved.from ? moved.to : cell,
      );
      expect(check(withDecoys, solution, answer(circles)).correct).toBe(false);
    }
  });

  it("ignores the stored solution", () => {
    expect(check(payload, [], answer(solution)).correct).toBe(true);
  });
});
