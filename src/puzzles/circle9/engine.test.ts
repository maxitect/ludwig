import { describe, expect, it } from "vitest";
import { content as fullCircle } from "../../../content/circle9/full-circle";
import { content as looseEnds } from "../../../content/circle9/loose-ends";
import {
  boxOf,
  clashingIndexes,
  countSolutions,
  layoutOf,
  solutions,
  solve,
} from "./engine";
import { decoys, payload, solution } from "./fixture";
import { numbers } from "./verify";

const indexes = solution.map(({ row, col }) => row * 9 + col);

describe("circle9 engine", () => {
  it("names the box of each cell", () => {
    expect(boxOf(0)).toBe(0);
    expect(boxOf(8)).toBe(2);
    expect(boxOf(4 * 9 + 4)).toBe(4);
    expect(boxOf(80)).toBe(8);
  });

  it("counts exactly one solution for a unique puzzle, and finds it", () => {
    const layout = layoutOf(payload);
    expect(countSolutions(layout)).toBe(1);
    expect(solve(layout)).toEqual(indexes);
  });

  it("counts two when an extra pair of numbers makes a second solution", () => {
    const layout = layoutOf({ numbers: [...payload.numbers, ...decoys] });
    expect(countSolutions(layout)).toBe(2);
    const found = solutions(layout).map((set) => set.join());
    expect(found).toContain(indexes.join());
    expect(found).toContain(
      indexes
        .map((index) => (index === 0 ? 1 : index === 28 ? 27 : index))
        .sort((x, y) => x - y)
        .join(),
    );
  });

  it("counts none when a digit is missing from the grid", () => {
    const layout = layoutOf({ numbers: payload.numbers.slice(0, 8) });
    expect(countSolutions(layout)).toBe(0);
    expect(solve(layout)).toBeNull();
  });

  it("counts none when a row is left with no number", () => {
    const crowded = payload.numbers.map((number) =>
      number.row === 8 ? { ...number, row: 7, col: 8 } : number,
    );
    expect(countSolutions(layoutOf({ numbers: crowded }))).toBe(0);
  });

  it("counts none on an empty grid", () => {
    expect(countSolutions(layoutOf({ numbers: [] }))).toBe(0);
  });

  it("stops counting at the limit", () => {
    const layout = layoutOf({ numbers: [...payload.numbers, ...decoys] });
    expect(countSolutions(layout, 1)).toBe(1);
    expect(solutions(layout, 1)).toHaveLength(1);
  });

  it("returns solutions that cover every digit, row, column and box once", () => {
    for (const content of [looseEnds, fullCircle]) {
      const layout = layoutOf({ numbers: numbers(content) });
      const [circled] = solutions(layout);
      expect(circled).toHaveLength(9);
      expect(new Set(circled.map((i) => layout.digits[i])).size).toBe(9);
      expect(new Set(circled.map((i) => Math.floor(i / 9))).size).toBe(9);
      expect(new Set(circled.map((i) => i % 9)).size).toBe(9);
      expect(new Set(circled.map(boxOf)).size).toBe(9);
    }
  });

  it("names the circles that share a digit, row, column or box", () => {
    const layout = layoutOf({ numbers: [...payload.numbers, ...decoys] });
    const clashes = (circled: number[]) =>
      [...clashingIndexes(layout, circled)].sort((x, y) => x - y);
    expect(clashes(indexes)).toEqual([]);
    expect(clashes([...indexes, 1])).toEqual([0, 1, 28]);
    expect(clashes([0, 27])).toEqual([0, 27]);
    expect(clashes([27, 1])).toEqual([]);
  });

  it("ignores a circle on an empty cell when naming clashes", () => {
    expect(clashingIndexes(layoutOf(payload), [2, 4]).size).toBe(0);
  });
});
