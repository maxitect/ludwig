import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { sliceFileCount } from "../_shared/generate/property";
import { regenerate } from "../generators";
import { classicUnits, gridFromGivens, solve, variantFor } from "./engine";
import {
  sudokuKillerGenerators,
  sudokuXvGenerators,
} from "./generate-variants";
import { VARIANT_SLICES } from "./generate-variants.property";

const variants = [
  { name: "sudoku-killer", versions: sudokuKillerGenerators },
  { name: "sudoku-xv", versions: sudokuXvGenerators },
] as const;

describe.each(variants)("$name generator", ({ name, versions }) => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = versions[1]("same", 3);
    expect(versions[1]("same", 3)).toEqual(first);
    expect(versions[1]("other", 3).content).not.toEqual(first.content);
    expect(regenerate({ generator: name, version: 1, seed: "same" }, 3)).toEqual(
      first,
    );
  });

  it("throws on an unknown version", () => {
    expect(Object.hasOwn(versions, 2)).toBe(false);
    expect(() =>
      regenerate({ generator: name, version: 2, seed: "same" }, 3),
    ).toThrow(/version/);
  });
});

describe("sudoku-killer layouts", () => {
  it("cover every cell with cages whose sums match the solved grid", () => {
    for (const difficulty of difficulties) {
      const { content } = sudokuKillerGenerators[1](`layout-${difficulty}`, difficulty);
      const cages = content.cages!;
      const cells = cages.flatMap(({ cells }) => cells);
      expect(new Set(cells.map(({ row, col }) => row * 9 + col)).size).toBe(81);
      expect(cells).toHaveLength(81);
      expect(content.xv).toBeUndefined();
      const grid = gridFromGivens(solve(content.givens, classicUnits, variantFor({ cages }))!);
      for (const { sum, cells } of cages) {
        expect(cells.reduce((total, { row, col }) => total + grid[row * 9 + col], 0)).toBe(sum);
      }
    }
  }, 60_000);

  it("can leave a puzzle with no givens", () => {
    const counts = [...Array(30).keys()].map(
      (index) => sudokuKillerGenerators[1](`bare-${index}`, 2).content.givens.length,
    );
    expect(Math.min(...counts)).toBe(0);
  }, 60_000);
});

describe("sudoku-xv layouts", () => {
  it("mark only pairs that make 5 or 10, with no cages", () => {
    for (const difficulty of difficulties) {
      const { content } = sudokuXvGenerators[1](`marks-${difficulty}`, difficulty);
      expect(content.cages).toBeUndefined();
      const { marks } = content.xv!;
      expect(marks.length).toBeGreaterThan(0);
      const grid = gridFromGivens(solve(content.givens, classicUnits, variantFor({ xv: content.xv }))!);
      for (const { row, col, direction, mark } of marks) {
        const index = row * 9 + col;
        const next = direction === "right" ? index + 1 : index + 9;
        expect(grid[index] + grid[next]).toBe(mark === "x" ? 10 : 5);
      }
    }
  }, 60_000);
});

describe("sudoku-killer and sudoku-xv property", () => {
  it("has a test file for every slice", () => {
    expect(sliceFileCount(import.meta.dirname, "generate-variants")).toBe(VARIANT_SLICES);
  });
});
