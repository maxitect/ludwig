import { describe, expect, it } from "vitest";
import { content as finePrint } from "../../../content/norinori/fine-print";
import { content as inkBlots } from "../../../content/norinori/ink-blots";
import type { Content } from "./schema";
import { verifyNorinori } from "./verify";

describe("verifyNorinori", () => {
  it("accepts unique puzzles", () => {
    expect(() => verifyNorinori(inkBlots)).not.toThrow();
    expect(() => verifyNorinori(finePrint)).not.toThrow();
  });

  it("rejects a grid with the wrong number of rows or cells", () => {
    expect(() =>
      verifyNorinori({ ...inkBlots, grid: inkBlots.grid.slice(1) }),
    ).toThrow(/5 rows, not 6/);
    const ragged = [...inkBlots.grid];
    ragged[2] = ragged[2].slice(1);
    expect(() => verifyNorinori({ ...inkBlots, grid: ragged })).toThrow(
      /row 3 has 5 cells, not 6/,
    );
  });

  it("rejects a one-cell region", () => {
    const grid: Content["grid"] = [...inkBlots.grid];
    grid[5] = "166337";
    expect(() => verifyNorinori({ ...inkBlots, grid })).toThrow(
      /has 1 cell, not at least 2/,
    );
  });

  it("rejects a region that is not edge-connected", () => {
    const split = ["010111", "223333", "223333", "444555", "444555", "444555"];
    expect(() => verifyNorinori({ rows: 6, cols: 6, grid: split })).toThrow(
      /region 0 is not edge-connected/,
    );
  });

  it("rejects regions that are not named from 0 without a gap", () => {
    const grid = inkBlots.grid.map((line) => line.replaceAll("6", "9"));
    expect(() => verifyNorinori({ ...inkBlots, grid })).toThrow(
      /named 0, 1, 2, 3, 4, 5, 9/,
    );
  });

  it("rejects a puzzle with more than one solution", () => {
    const loose = ["00000", "11111", "22222", "33333", "44444"];
    expect(() => verifyNorinori({ rows: 5, cols: 5, grid: loose })).toThrow(
      /more than one solution/,
    );
  });

  it("rejects a contradictory puzzle", () => {
    expect(() =>
      verifyNorinori({ rows: 2, cols: 2, grid: ["00", "11"] }),
    ).toThrow(/no solution/);
  });
});
