import { describe, expect, it } from "vitest";
import { content as finePrint } from "../../../content/norinori/fine-print";
import { content as inkBlots } from "../../../content/norinori/ink-blots";
import {
  conflictingIndexes,
  countSolutions,
  loneIndexes,
  solutions,
  solve,
  type Layout,
} from "./engine";
import { regionCells } from "./verify";

const layoutOfGrid = (grid: string[]): Layout => ({
  rows: grid.length,
  cols: grid[0].length,
  regionOf: grid.flatMap((line) => [...line].map((ch) => parseInt(ch, 36))),
});

/** Every shaded cell has exactly one shaded neighbour and every region has two shaded cells. */
function valid({ rows, cols, regionOf }: Layout, shaded: readonly number[]) {
  const on = new Set(shaded);
  const perRegion = new Map<number, number>();
  for (const index of on) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const neighbours = [
      row > 0 && on.has(index - cols),
      row < rows - 1 && on.has(index + cols),
      col > 0 && on.has(index - 1),
      col < cols - 1 && on.has(index + 1),
    ].filter(Boolean).length;
    if (neighbours !== 1) return false;
    perRegion.set(regionOf[index], (perRegion.get(regionOf[index]) ?? 0) + 1);
  }
  return new Set(regionOf).size === perRegion.size &&
    [...perRegion.values()].every((count) => count === 2);
}

/** A search over cells, one at a time, that shares nothing with the engine. */
function bruteForce(layout: Layout) {
  const cells = layout.rows * layout.cols;
  let count = 0;
  const walk = (index: number, shaded: number[]) => {
    if (index === cells) {
      if (valid(layout, shaded)) count++;
      return;
    }
    walk(index + 1, shaded);
    walk(index + 1, [...shaded, index]);
  };
  walk(0, []);
  return count;
}

function random(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
}

describe("countSolutions", () => {
  it("finds the one solution of a 2 by 3 grid with a column region beside a block", () => {
    const layout = layoutOfGrid(["011", "011"]);
    expect(countSolutions(layout)).toBe(1);
    expect(solve(layout)).toEqual([0, 2, 3, 5]);
  });

  it("finds exactly two solutions when the second region has two dominoes to take", () => {
    const layout = layoutOfGrid(["001111"]);
    expect(countSolutions(layout)).toBe(2);
    expect(solutions(layout).sort()).toEqual([
      [0, 1, 3, 4],
      [0, 1, 4, 5],
    ]);
  });

  it("stops counting at the limit", () => {
    const layout = layoutOfGrid(["0000"]);
    expect(solutions(layout)).toHaveLength(3);
    expect(countSolutions(layout, 2)).toBe(2);
    expect(countSolutions(layout, 5)).toBe(3);
  });

  it("reports a contradictory grid as having none", () => {
    expect(countSolutions(layoutOfGrid(["00", "11"]))).toBe(0);
    expect(solve(layoutOfGrid(["00", "11"]))).toBeNull();
  });

  it("finds four ways to place one domino in a lone 2 by 2 region", () => {
    expect(solutions(layoutOfGrid(["00", "00"]))).toHaveLength(4);
  });

  it("finds exactly one solution for the curated puzzles, and that solution is valid", () => {
    for (const content of [inkBlots, finePrint]) {
      const layout = layoutOfGrid(content.grid);
      const found = solutions(layout);
      expect(found).toHaveLength(1);
      expect(valid(layout, found[0])).toBe(true);
      expect(regionCells(content)).toHaveLength(content.rows * content.cols);
    }
  });

  it("agrees with a cell-by-cell search on small random grids", () => {
    const next = random(97);
    let seen = 0;
    for (let round = 0; round < 40; round++) {
      const rows = 3 + Math.floor(next() * 2);
      const cols = 3 + Math.floor(next() * 2);
      const regions = 2 + Math.floor(next() * 3);
      const regionOf = Array.from({ length: rows * cols }, () =>
        Math.floor(next() * regions),
      );
      const layout = { rows, cols, regionOf };
      const expected = bruteForce(layout);
      expect(solutions(layout)).toHaveLength(expected);
      if (expected > 0) seen++;
    }
    expect(seen).toBeGreaterThan(3);
  });
});

describe("conflictingIndexes", () => {
  const layout = layoutOfGrid(["0011", "0011"]);

  it("flags the middle cell of an L-shaped tromino", () => {
    const columns = layoutOfGrid(["0123", "0123"]);
    expect([...conflictingIndexes(columns, [0, 1, 5])]).toEqual([1]);
  });

  it("flags every shaded cell of a region holding three", () => {
    const strip = layoutOfGrid(["00000"]);
    expect([...conflictingIndexes(strip, [0, 2, 4])].sort()).toEqual([0, 2, 4]);
  });

  it("leaves a lone cell and a clean domino alone", () => {
    expect(conflictingIndexes(layout, [0, 4]).size).toBe(0);
    expect([...loneIndexes(layout, [0, 4, 3])]).toEqual([3]);
  });
});
