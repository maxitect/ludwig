import { describe, expect, it } from "vitest";
import { ambiguous, content } from "./fixture";
import { verifyKakuro } from "./verify";

describe("verifyKakuro", () => {
  it("accepts a uniquely solvable puzzle", () => {
    expect(() => verifyKakuro(content)).not.toThrow();
  });

  it("rejects a single-cell run", () => {
    expect(() =>
      verifyKakuro({
        ...content,
        cells: [...content.cells, { row: 4, col: 4, digit: 5 }],
      }),
    ).toThrow(/single cell/);
  });

  it("rejects a run with a repeated digit", () => {
    expect(() =>
      verifyKakuro({
        ...content,
        cells: content.cells.map((cell) =>
          cell.row === 1 && cell.col === 2 ? { ...cell, digit: 1 } : cell,
        ),
      }),
    ).toThrow(/repeats 1/);
  });

  it("rejects a run with no clue cell before it", () => {
    expect(() =>
      verifyKakuro({
        ...content,
        cells: content.cells.map((cell) => ({ ...cell, col: cell.col - 1 })),
      }),
    ).toThrow(/no clue cell/);
  });

  it("rejects a duplicate cell", () => {
    expect(() =>
      verifyKakuro({ ...content, cells: [...content.cells, content.cells[0]] }),
    ).toThrow(/duplicate/);
  });

  it("rejects a puzzle with two solutions", () => {
    expect(() => verifyKakuro({ ...content, cells: ambiguous })).toThrow(
      /more than one/,
    );
  });
});
