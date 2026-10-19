import { describe, expect, it } from "vitest";
import { content as inkBlots } from "../../../content/norinori/ink-blots";
import { check } from "./check";
import { layoutOf, solve } from "./engine";
import type { Content, Payload } from "./schema";
import { regionCells } from "./verify";

const payloadOf = ({ rows, cols, grid }: Pick<Content, "rows" | "cols" | "grid">): Payload => ({
  rows,
  cols,
  regions: regionCells({ grid }),
});

const shadedOf = (payload: Payload) =>
  (solve(layoutOf(payload)) ?? []).map((index) => ({
    row: Math.floor(index / payload.cols),
    col: index % payload.cols,
  }));

describe("check", () => {
  const payload = payloadOf(inkBlots);
  const solved = shadedOf(payload);

  it("accepts the solution", () => {
    expect(check(payload, [], { shaded: solved })).toEqual({
      correct: true,
      wrongParts: [],
    });
  });

  it("rejects an answer that is one cell short", () => {
    const result = check(payload, [], { shaded: solved.slice(1) });
    expect(result.correct).toBe(false);
  });

  it("rejects a cell placed outside the grid", () => {
    const [first, ...rest] = solved;
    for (const outside of [
      { row: payload.rows, col: first.col },
      { row: first.row, col: first.col + payload.cols },
    ]) {
      expect(check(payload, [], { shaded: [outside, ...rest] }).correct).toBe(
        false,
      );
    }
  });

  it("rejects an L-shaped tromino and names the cells with two neighbours", () => {
    const small = payloadOf({
      rows: 2,
      cols: 3,
      grid: ["011", "011"],
    });
    const result = check(small, [], {
      shaded: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual([
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ]);
  });

  it("rejects two dominoes touching along an edge and names all four cells", () => {
    const stacked = payloadOf({ rows: 2, cols: 2, grid: ["00", "11"] });
    const shaded = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ];
    const result = check(stacked, [], { shaded });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual(shaded);
  });

  it("names the shaded cells that belong to no domino", () => {
    const strip = payloadOf({ rows: 1, cols: 6, grid: ["001111"] });
    const result = check(strip, [], {
      shaded: [0, 1, 3, 5].map((col) => ({ row: 0, col })),
    });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toEqual([
      { row: 0, col: 3 },
      { row: 0, col: 5 },
    ]);
  });

  it("fails every single-cell perturbation of the solution", () => {
    for (const [i, moved] of solved.entries()) {
      for (const shift of [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ]) {
        const to = {
          row: (moved.row + shift.row) % payload.rows,
          col: (moved.col + shift.col) % payload.cols,
        };
        const shaded = solved.map((cell, at) => (at === i ? to : cell));
        expect(check(payload, [], { shaded }).correct).toBe(false);
      }
    }
  });
});
