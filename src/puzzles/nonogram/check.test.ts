import { describe, expect, it } from "vitest";
import { content as gear } from "../../../content/nonogram/blind-spot";
import { check } from "./check";
import { cluesOf } from "./derive";
import type { Payload, Solution } from "./schema";
import { shadedCells } from "./verify";

const { rows, cols, caption } = gear;
const cells = shadedCells(gear);
const payload: Payload = { rows, cols, ...cluesOf(rows, cols, cells) };
const solution: Solution = { cells, caption };

describe("check", () => {
  it("accepts the picture and reveals the caption", () => {
    expect(check(payload, solution, { shaded: cells })).toEqual({
      correct: true,
      epilogue: caption,
    });
  });

  it("accepts the cells in any order", () => {
    expect(
      check(payload, solution, { shaded: [...cells].reverse() }).correct,
    ).toBe(true);
  });

  it("rejects an answer that is one cell short, and keeps the caption back", () => {
    expect(check(payload, solution, { shaded: cells.slice(1) })).toEqual({
      correct: false,
    });
  });

  it("rejects an extra cell and a moved cell", () => {
    expect(
      check(payload, solution, { shaded: [...cells, { row: 0, col: 0 }] })
        .correct,
    ).toBe(false);
    const [first, ...rest] = cells;
    expect(
      check(payload, solution, {
        shaded: [{ row: first.row, col: first.col + 1 }, ...rest],
      }).correct,
    ).toBe(false);
  });

  it("rejects a cell outside the grid", () => {
    const [first, ...rest] = cells;
    for (const outside of [
      { row: rows, col: first.col },
      { row: first.row, col: cols },
    ]) {
      expect(check(payload, solution, { shaded: [outside, ...rest] }).correct).toBe(
        false,
      );
    }
  });

  it("is decided by the clues, not by the stored cells", () => {
    expect(
      check(payload, { cells: [], caption }, { shaded: cells }).correct,
    ).toBe(true);
  });
});
