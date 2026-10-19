import { describe, expect, it } from "vitest";
import { content as threeOfAKind } from "../../../content/troix/three-of-a-kind";
import { content as theThirdSymbol } from "../../../content/troix/the-third-symbol";
import {
  conflictingIndexes,
  countSolutions,
  enumerateSolutions,
  gridFromGivens,
  solve,
} from "./engine";
import { payload, solution } from "./fixture";
import type { Given } from "./schema";

describe("countSolutions", () => {
  it("counts exactly one for a unique puzzle", () => {
    expect(countSolutions(payload)).toBe(1);
    expect(solve(payload)).toEqual(solution);
    expect(countSolutions(threeOfAKind)).toBe(1);
    expect(countSolutions(theThirdSymbol)).toBe(1);
  });

  it("counts two when one given is left out and two grids fit", () => {
    const loose = {
      size: 6,
      givens: payload.givens.filter(({ row, col }) => !(row === 1 && col === 0)),
    };
    expect(countSolutions(loose, 10)).toBe(2);
    const [first, second] = enumerateSolutions(loose, 10);
    expect(first).not.toEqual(second);
  });

  it("stops counting at the limit", () => {
    expect(countSolutions({ size: 6, givens: [] }, 2)).toBe(2);
    expect(countSolutions({ size: 6, givens: [] }, 5)).toBe(5);
  });

  it("finds none when the givens contradict the rules", () => {
    const run: Given[] = [0, 1, 2].map((col) => ({ row: 0, col, symbol: "x" }));
    expect(countSolutions({ size: 6, givens: run })).toBe(0);
    const crowded: Given[] = [0, 2, 4].map((col) => ({
      row: 0,
      col,
      symbol: "x",
    }));
    expect(countSolutions({ size: 6, givens: crowded })).toBe(0);
  });

  it("finds none when the givens break no rule themselves but no grid completes them", () => {
    const givens = payload.givens.map((given) =>
      given.row === 1 && given.col === 0 ? { ...given, symbol: "x" as const } : given,
    );
    expect(conflictingIndexes(6, gridFromGivens(6, givens)).size).toBe(0);
    expect(countSolutions({ size: 6, givens })).toBe(0);
  });
});

describe("conflictingIndexes", () => {
  const rowOnly = (letters: string, size = 9) => {
    const grid = Array<number>(size * size).fill(0);
    [...letters].forEach((letter, col) => {
      grid[col] = "XOI".indexOf(letter) + 1;
    });
    return grid;
  };

  it("names nothing for a solved grid", () => {
    expect(conflictingIndexes(6, gridFromGivens(6, solution)).size).toBe(0);
  });

  it("names the three cells of a run", () => {
    expect([...conflictingIndexes(9, rowOnly("XOOOIXIXI"))].sort()).toEqual([
      1, 2, 3,
    ]);
  });

  it("names the cells holding a symbol over its quota of three in a 9-wide line", () => {
    expect([...conflictingIndexes(9, rowOnly("XOXOXIXII"))].sort()).toEqual([
      0, 2, 4, 6,
    ]);
  });

  it("does not flag a symbol that is at its quota", () => {
    expect(conflictingIndexes(9, rowOnly("XOXOIXIOI")).size).toBe(0);
  });
});
