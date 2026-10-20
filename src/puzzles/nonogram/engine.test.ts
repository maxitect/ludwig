import { describe, expect, it } from "vitest";
import { content as bumps } from "../../../content/nonogram/bumps-in-the-night";
import { content as gear } from "../../../content/nonogram/blind-spot";
import { cluesOf } from "./derive";
import {
  countSolutions,
  EMPTY,
  FILLED,
  propagate,
  solutions,
  solve,
  solveLine,
  UNKNOWN,
} from "./engine";
import { shadedCells } from "./verify";

const cluesOfGrid = (grid: string[]) =>
  cluesOf(grid.length, grid[0].length, shadedCells({ grid }));
const unknown = (length: number) => Array<number>(length).fill(UNKNOWN);

describe("solveLine", () => {
  it("forces the overlap of a long run", () => {
    expect(solveLine([3], unknown(5))).toEqual([
      UNKNOWN,
      UNKNOWN,
      FILLED,
      UNKNOWN,
      UNKNOWN,
    ]);
  });

  it("fixes a line whose runs and gaps fill it exactly", () => {
    expect(solveLine([1, 1, 1], unknown(5))).toEqual([
      FILLED,
      EMPTY,
      FILLED,
      EMPTY,
      FILLED,
    ]);
  });

  it("empties a line with no runs and fills a full one", () => {
    expect(solveLine([], unknown(4))).toEqual([EMPTY, EMPTY, EMPTY, EMPTY]);
    expect(solveLine([4], unknown(4))).toEqual([FILLED, FILLED, FILLED, FILLED]);
  });

  it("uses cells already known to pin a run", () => {
    expect(solveLine([2], [UNKNOWN, UNKNOWN, FILLED, UNKNOWN, UNKNOWN])).toEqual(
      [EMPTY, UNKNOWN, FILLED, UNKNOWN, EMPTY],
    );
    expect(solveLine([1, 2], [FILLED, UNKNOWN, UNKNOWN, UNKNOWN, UNKNOWN])).toEqual(
      [FILLED, EMPTY, UNKNOWN, FILLED, UNKNOWN],
    );
  });

  it("reports a contradiction", () => {
    expect(solveLine([3], unknown(2))).toBeNull();
    expect(solveLine([2, 2], unknown(4))).toBeNull();
    expect(solveLine([1], [FILLED, UNKNOWN, FILLED])).toBeNull();
    expect(solveLine([], [UNKNOWN, FILLED])).toBeNull();
  });
});

describe("propagate", () => {
  it("solves a picture that lines alone decide", () => {
    const clues = cluesOfGrid(["##.", "#..", "###"]);
    expect(propagate(clues, unknown(9))).toEqual([
      FILLED, FILLED, EMPTY,
      FILLED, EMPTY, EMPTY,
      FILLED, FILLED, FILLED,
    ]);
  });
});

describe("countSolutions", () => {
  it("counts exactly one for a unique picture", () => {
    expect(countSolutions(cluesOfGrid(["#####", "#...#", "#.#.#", "#...#", "#####"]))).toBe(1);
    expect(countSolutions(cluesOfGrid(gear.grid))).toBe(1);
  });

  it("counts two for a 2 by 2 checker inside the grid, and stops there", () => {
    const grid = [".....", ".#...", "..#..", ".....", "....."];
    const clues = cluesOfGrid(grid);
    expect(countSolutions(clues)).toBe(2);
    expect(countSolutions(clues, 1)).toBe(1);
    expect(countSolutions(clues, 10)).toBe(2);
  });

  it("counts none for clues no picture satisfies", () => {
    const impossible = (rowClues: number[][], colClues: number[][]) =>
      countSolutions({ rowClues, colClues });
    expect(impossible([[6], [], [], [], []], [[1], [1], [1], [1], [1]])).toBe(0);
    expect(impossible([[1], [], []], [[1], [1], []])).toBe(0);
    expect(
      impossible(
        [[2], [2]],
        [[1], [1], [1], []],
      ),
    ).toBe(0);
  });

  it("finds the picture a clue set was cut from", () => {
    const solved = solve(cluesOfGrid(bumps.grid));
    expect(solved).toEqual(shadedCells(bumps));
  });

  it("returns every solution up to the limit", () => {
    const found = solutions(cluesOfGrid([".....", ".#...", "..#..", ".....", "....."]));
    expect(found).toHaveLength(2);
    expect(found[0]).not.toEqual(found[1]);
  });

  it("settles the largest grid quickly", () => {
    const size = 25;
    const grid = Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => {
        const ring = Math.hypot(row - 12, col - 12);
        return ring < 11 && (ring > 8 || ring < 4 || (row + col) % 7 === 0) ? "#" : ".";
      }).join(""),
    );
    const start = performance.now();
    const count = countSolutions(cluesOfGrid(grid));
    expect(count).toBeGreaterThanOrEqual(1);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});
