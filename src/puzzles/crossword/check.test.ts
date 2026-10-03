import { describe, expect, it } from "vitest";
import { check, checkCell, revealCell } from "./check";
import { cells } from "./fixture";
import type { Payload } from "./schema";

const payload = { style: "quick", rows: 5, cols: 5, cells: [], clues: [] } satisfies Payload;
const answer = { cells };
const run = (entered: typeof cells) =>
  check(payload, cells, { cells: entered }).correct;

describe("check", () => {
  it("accepts the filled grid", () => {
    expect(run(cells)).toBe(true);
  });

  it("rejects every single-cell perturbation", () => {
    for (const [i, cell] of cells.entries()) {
      const letter = cell.letter === "Z" ? "A" : "Z";
      const perturbed = cells.map((c, j) => (i === j ? { ...c, letter } : c));
      expect(run(perturbed)).toBe(false);
    }
  });

  it("rejects an unfilled cell", () => {
    expect(run(cells.slice(1))).toBe(false);
  });

  it("rejects a letter on a block", () => {
    expect(run([...cells, { row: 1, col: 1, letter: "A" }])).toBe(false);
  });

  it("returns only whether the grid is correct", () => {
    expect(check(payload, cells, answer)).toEqual({ correct: true });
  });
});

describe("checkCell", () => {
  it("accepts the solution letter in either case", () => {
    expect(checkCell(payload, cells, 0, 0, "C")).toEqual({ correct: true });
    expect(checkCell(payload, cells, 0, 0, "c")).toEqual({ correct: true });
  });

  it("rejects another letter or a block", () => {
    expect(checkCell(payload, cells, 0, 0, "D")).toEqual({ correct: false });
    expect(checkCell(payload, cells, 1, 1, "A")).toEqual({ correct: false });
  });
});

describe("revealCell", () => {
  it("returns one cell's letter and null for a block", () => {
    expect(revealCell(cells, 0, 1)).toBe("R");
    expect(revealCell(cells, 1, 1)).toBeNull();
  });
});
