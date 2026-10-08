import { describe, expect, it } from "vitest";
import { selectionPath } from "./path";

const bounds = { rows: 6, cols: 6 };

describe("selectionPath", () => {
  it("is the single cell when start and end match", () => {
    expect(selectionPath({ row: 2, col: 2 }, { row: 2, col: 2 }, bounds)).toEqual([
      { row: 2, col: 2 },
    ]);
  });

  it("covers a row, a column and both diagonals", () => {
    expect(selectionPath({ row: 1, col: 1 }, { row: 1, col: 3 }, bounds)).toEqual([
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
    ]);
    expect(selectionPath({ row: 3, col: 0 }, { row: 1, col: 0 }, bounds)).toEqual([
      { row: 3, col: 0 },
      { row: 2, col: 0 },
      { row: 1, col: 0 },
    ]);
    expect(selectionPath({ row: 0, col: 0 }, { row: 2, col: 2 }, bounds)).toHaveLength(3);
    expect(selectionPath({ row: 0, col: 4 }, { row: 2, col: 2 }, bounds)).toEqual([
      { row: 0, col: 4 },
      { row: 1, col: 3 },
      { row: 2, col: 2 },
    ]);
  });

  it("snaps an off-line end to the nearest direction", () => {
    const path = selectionPath({ row: 0, col: 0 }, { row: 1, col: 4 }, bounds);
    expect(path.map(({ row }) => row)).toEqual([0, 0, 0, 0, 0]);
    expect(path.map(({ col }) => col)).toEqual([0, 1, 2, 3, 4]);
  });

  it("stops at the grid edge", () => {
    const path = selectionPath({ row: 0, col: 4 }, { row: 4, col: 8 }, bounds);
    expect(path).toEqual([
      { row: 0, col: 4 },
      { row: 1, col: 5 },
    ]);
  });
});
