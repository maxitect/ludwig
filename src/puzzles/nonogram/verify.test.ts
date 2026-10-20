import { describe, expect, it } from "vitest";
import { content as bumps } from "../../../content/nonogram/bumps-in-the-night";
import { content as gear } from "../../../content/nonogram/blind-spot";
import { content as inkWell } from "../../../content/nonogram/ink-well";
import type { Content } from "./schema";
import { shadedCells, verifyNonogram } from "./verify";

describe("verifyNonogram", () => {
  it("accepts unique pictures", () => {
    for (const content of [gear, inkWell, bumps]) {
      expect(() => verifyNonogram(content)).not.toThrow();
    }
  });

  it("rejects a grid with the wrong number of rows or cells", () => {
    expect(() => verifyNonogram({ ...gear, grid: gear.grid.slice(1) })).toThrow(
      /12 rows, not 13/,
    );
    const ragged = [...gear.grid];
    ragged[2] = ragged[2].slice(1);
    expect(() => verifyNonogram({ ...gear, grid: ragged })).toThrow(
      /row 3 has 12 cells, not 13/,
    );
  });

  it("rejects a picture with more than one solution", () => {
    const checker: Content = {
      rows: 5,
      cols: 5,
      caption: "x",
      grid: [".....", ".#...", "..#..", ".....", "....."],
    };
    expect(() => verifyNonogram(checker)).toThrow(/more than one solution/);
  });

  it("lists the shaded cells of a written picture", () => {
    expect(shadedCells({ grid: ["#.", ".#"] })).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ]);
  });
});
