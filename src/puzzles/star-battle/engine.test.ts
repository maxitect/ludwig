import { describe, expect, it } from "vitest";
import { content } from "../../../content/star-battle/double-bill";
import {
  conflictingIndexes,
  countSolutions,
  layoutOf,
  solutions,
  solve,
  type Layout,
} from "./engine";

const fromRows = (rows: string[], stars: number): Layout => ({
  size: rows.length,
  stars,
  regionOf: rows.flatMap((line) => [...line].map(Number)),
});

/** Independent cell-by-cell search, used to cross-check the row-by-row one. A row must hold exactly `stars` once it is passed. */
function bruteForce({ size, stars, regionOf }: Layout) {
  const placed = new Set<number>();
  const rowCount = Array<number>(size).fill(0);
  const colCount = Array<number>(size).fill(0);
  const regionCount = Array<number>(size).fill(0);
  let count = 0;
  const go = (index: number) => {
    if (index === size * size) {
      const exact = (counts: number[]) => counts.every((n) => n === stars);
      if (exact(colCount) && exact(regionCount)) count++;
      return;
    }
    const row = Math.floor(index / size);
    const col = index % size;
    const next = () => {
      if (col === size - 1 && rowCount[row] !== stars) return;
      go(index + 1);
    };
    next();
    const touches = [-size - 1, -size, -size + 1, -1].some((delta) => {
      const other = index + delta;
      return (
        placed.has(other) && Math.abs((other % size) - col) <= 1
      );
    });
    if (
      touches ||
      rowCount[row] >= stars ||
      colCount[col] >= stars ||
      regionCount[regionOf[index]] >= stars
    )
      return;
    placed.add(index);
    rowCount[row]++;
    colCount[col]++;
    regionCount[regionOf[index]]++;
    next();
    placed.delete(index);
    rowCount[row]--;
    colCount[col]--;
    regionCount[regionOf[index]]--;
  };
  go(0);
  return count;
}

const DOUBLE_BILL = content;

const ROWS_4 = ["0000", "1111", "2222", "3333"];
const ROWS_5 = ["00000", "11111", "22222", "33333", "44444"];

describe("countSolutions at one star", () => {
  it("counts the two arrangements of non-touching queens-by-kings on 4 rows", () => {
    expect(countSolutions(fromRows(ROWS_4, 1), Infinity)).toBe(2);
    expect(solutions(fromRows(ROWS_4, 1)).map((s) => s.map((i) => i % 4))).toEqual(
      [
        [1, 3, 0, 2],
        [2, 0, 3, 1],
      ],
    );
  });

  it("finds a unique puzzle when one region cell breaks the symmetry", () => {
    const layout = fromRows(["0010", "1111", "2222", "3333"], 1);
    expect(countSolutions(layout, Infinity)).toBe(1);
    expect(solve(layout)?.map((i) => i % 4)).toEqual([1, 3, 0, 2]);
  });

  it("finds many solutions for plain row regions, and stops at the limit", () => {
    expect(countSolutions(fromRows(ROWS_5, 1), Infinity)).toBe(14);
    expect(countSolutions(fromRows(ROWS_5, 1))).toBe(2);
  });

  it("finds none for a contradictory puzzle", () => {
    expect(countSolutions(fromRows(["000", "111", "222"], 1))).toBe(0);
    expect(solve(fromRows(["000", "111", "222"], 1))).toBeNull();
  });
});

describe("countSolutions at two stars", () => {
  const rows8 = fromRows(Array.from({ length: 8 }, (_, i) => String(i).repeat(8)), 2);

  it("agrees with an independent search over every subset", () => {
    const expected = bruteForce(rows8);
    expect(expected).toBeGreaterThan(0);
    expect(countSolutions(rows8, Infinity)).toBe(expected);
  });

  it("stops at the limit", () => {
    expect(countSolutions(rows8, 1)).toBe(1);
  });

  it("finds a unique solution for a curated 8 by 8", () => {
    const layout = fromRows(DOUBLE_BILL.grid, 2);
    expect(countSolutions(layout, Infinity)).toBe(1);
    expect(conflictingIndexes(layout, solve(layout) ?? []).size).toBe(0);
  });

  it("finds exactly two solutions when one region cell is moved", () => {
    const layout = fromRows(
      [
        "111111113",
        "550111133",
        "550000333",
        "555000377",
        "555222777",
        "444222777",
        "444226668",
        "444426668",
        "444666688",
      ],
      2,
    );
    const found = solutions(layout);
    expect(found).toHaveLength(2);
    expect(found[0]).not.toEqual(found[1]);
    for (const stars of found) {
      expect(conflictingIndexes(layout, stars).size).toBe(0);
    }
  });

  it("finds none when a region cannot hold two stars", () => {
    const layout = fromRows(
      ["01111111", ...Array.from({ length: 7 }, (_, i) => String(i + 1).repeat(8))],
      2,
    );
    expect(countSolutions(layout)).toBe(0);
    expect(solve(layout)).toBeNull();
  });

  it("agrees with the brute force on an irregular 7 by 7 grid", () => {
    const layout = fromRows(
      ["0011111", "0011211", "0222211", "3332244", "3532444", "5556444", "5566666"],
      2,
    );
    expect(countSolutions(layout, Infinity)).toBe(bruteForce(layout));
  });
});

describe("layoutOf", () => {
  it("lays the payload regions out by cell index", () => {
    const layout = layoutOf({
      size: 5,
      stars: 1,
      regions: Array.from({ length: 25 }, (_, i) => ({
        row: Math.floor(i / 5),
        col: i % 5,
        region: i % 5,
      })),
    });
    expect(layout.regionOf.slice(0, 7)).toEqual([0, 1, 2, 3, 4, 0, 1]);
  });
});

describe("conflictingIndexes", () => {
  const layout = fromRows(ROWS_5, 1);

  it("flags nothing for a valid partial placement", () => {
    expect(conflictingIndexes(layout, [1, 8, 10]).size).toBe(0);
  });

  it("flags both stars that touch diagonally", () => {
    expect([...conflictingIndexes(layout, [6, 12])].sort((a, b) => a - b)).toEqual([6, 12]);
  });

  it("flags both stars that touch along a row or a column", () => {
    expect([...conflictingIndexes(layout, [0, 1])].sort((a, b) => a - b)).toEqual([0, 1]);
    expect([...conflictingIndexes(layout, [0, 5])].sort((a, b) => a - b)).toEqual([0, 5]);
  });

  it("flags every star in a row, column or region over its count", () => {
    const sorted = (indexes: Iterable<number>) => [...indexes].sort((a, b) => a - b);
    expect(sorted(conflictingIndexes(layout, [0, 2]))).toEqual([0, 2]);
    expect(sorted(conflictingIndexes(layout, [0, 10]))).toEqual([0, 10]);
    const blocks = fromRows(["00011", "00011", "22233", "22233", "44444"], 1);
    expect(sorted(conflictingIndexes(blocks, [0, 13, 21]))).toEqual([]);
    expect(sorted(conflictingIndexes(blocks, [0, 6]))).toEqual([0, 6]);
    expect(sorted(conflictingIndexes(blocks, [0, 4, 21, 2]))).toEqual([0, 2, 4]);
  });

  it("allows two stars per unit when stars is 2", () => {
    const two = fromRows(ROWS_5, 2);
    expect(conflictingIndexes(two, [0, 2]).size).toBe(0);
    expect([...conflictingIndexes(two, [0, 2, 4])].sort()).toEqual([0, 2, 4]);
  });
});
