import { describe, expect, it } from "vitest";
import { content as balanceSheet } from "../../../content/sudoku/balance-sheet";
import { content as tallyMarks } from "../../../content/sudoku/tally-marks";
import { createState } from "../_shared/generate/candidates";
import {
  classicUnits,
  enumerateSolutions,
  type Grid,
  gridFromGivens,
  variantFor,
} from "./engine";
import {
  sudokuKillerGenerators,
  sudokuXvGenerators,
} from "./generate-variants";
import { afterPlaceFor, variantTechniques } from "./grade-variants";
import { gradeSudoku, techniquesFor } from "./grade";
import type { Cage, Content, Xv } from "./schema";

/** The cyclic grid: row r holds (3 * (r mod 3) + floor(r / 3) + c) mod 9 + 1 in column c. */
const SOLVED: Grid = Array.from(
  { length: 81 },
  (_, index) =>
    ((3 * (Math.floor(index / 9) % 3) + Math.floor(index / 27) + (index % 9)) % 9) + 1,
);

const withBlanks = (...blanks: number[]) =>
  SOLVED.map((digit, index) => (blanks.includes(index) ? 0 : digit));

/** Horizontal dominoes, each row ending in a lone cell. */
const dominoes: Cage[] = Array.from({ length: 9 }, (_, row) =>
  [0, 2, 4, 6, 8].map((col) => {
    const cells = [{ row, col }, ...(col < 8 ? [{ row, col: col + 1 }] : [])];
    return {
      sum: cells.reduce((sum, cell) => sum + SOLVED[cell.row * 9 + cell.col], 0),
      cells,
    };
  }),
).flat();

/** Every adjacent pair that makes 10 or 5 in the cyclic grid. */
const marks: Xv["marks"] = SOLVED.flatMap((digit, index) => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const found: Xv["marks"] = [];
  for (const [direction, next] of [
    ["right", col < 8 ? index + 1 : -1],
    ["down", row < 8 ? index + 9 : -1],
  ] as const) {
    if (next < 0) continue;
    const total = digit + SOLVED[next];
    if (total === 10 || total === 5) {
      found.push({ row, col, direction, mark: total === 10 ? "x" : "v" });
    }
  }
  return found;
});

const killer = variantFor({ cages: dominoes })!;
const xv = variantFor({ xv: { marks } })!;

describe("gradeSudoku on a killer", () => {
  it("grades a nearly complete grid as 1", () => {
    expect(gradeSudoku(withBlanks(0, 40, 80), 5, classicUnits, killer)).toMatchObject({
      difficulty: 1,
    });
  });

  it("places the last empty cell of a cage from its sum", () => {
    const single = variantTechniques(killer).find(({ name }) => name === "cage single")!;
    const grid = Array(81).fill(0);
    grid[1] = SOLVED[1];
    const state = createState(grid, 9, classicUnits);
    expect(single.apply(state)).toBe(true);
    expect(state.grid[0]).toBe(SOLVED[0]);
  });

  it("narrows a cage to the digits of its combinations", () => {
    const combinations = variantTechniques(variantFor({
      cages: [{ sum: 3, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] }],
    })!).find(({ name }) => name === "cage combinations")!;
    const state = createState(Array(81).fill(0), 9, classicUnits);
    expect(combinations.apply(state)).toBe(true);
    expect(state.cand[0]).toBe(0b110);
    expect(state.cand[1]).toBe(0b110);
    expect(state.cand[2]).toBe(0b1111111110);
  });

  it("gives a row's one uncaged cell 45 less the cages inside the row", () => {
    const uncaged = variantFor({
      cages: dominoes.filter(({ cells }) => !(cells.length === 1 && cells[0].row === 0)),
    })!;
    const innie = variantTechniques(uncaged).find(
      ({ name }) => name === "cage sum arithmetic (1 cell)",
    )!;
    const state = createState(Array(81).fill(0), 9, classicUnits);
    expect(innie.apply(state)).toBe(true);
    expect(state.cand[8]).toBe(1 << SOLVED[8]);
  });

  it("grades a puzzle that needs cage sum arithmetic over three cells as 5, and null below it", () => {
    const grid = gridFromGivens(balanceSheet.givens);
    const cages = variantFor({ cages: balanceSheet.cages });
    const grade = gradeSudoku(grid, 5, classicUnits, cages);
    expect(grade?.difficulty).toBe(5);
    expect(grade?.uses["cage sum arithmetic (3 cells)"]).toBeGreaterThan(0);
    expect(gradeSudoku(grid, 4, classicUnits, cages)).toBeNull();
  });
});

describe("gradeSudoku on an XV", () => {
  it("grades a nearly complete grid as 1", () => {
    expect(gradeSudoku(withBlanks(0, 40, 80), 5, classicUnits, xv)).toMatchObject({
      difficulty: 1,
      hardest: "naked single",
    });
  });

  it("narrows a pair against a placed digit at once", () => {
    const grid = Array(81).fill(0);
    grid[0] = 3;
    const withMark = variantFor({
      xv: { marks: [{ row: 0, col: 0, direction: "right", mark: "x" }] },
    })!;
    const state = createState(grid, 9, classicUnits, afterPlaceFor(withMark));
    expect(state.cand[1]).toBe(1 << 7);
    expect(state.cand[9] & (1 << 2)).toBe(0);
    expect(state.cand[9] & (1 << 7)).toBe(0);
  });

  it("grades a puzzle that needs an xy-wing as 4, and null below it", () => {
    const grid = gridFromGivens(tallyMarks.givens);
    const marked = variantFor({ xv: tallyMarks.xv });
    const grade = gradeSudoku(grid, 5, classicUnits, marked);
    expect(grade?.difficulty).toBe(4);
    expect(grade?.uses["xy-wing"]).toBeGreaterThan(0);
    expect(grade?.uses["xv pair"]).toBeGreaterThan(0);
    expect(gradeSudoku(grid, 3, classicUnits, marked)).toBeNull();
  });
});

function keepsSolution({ givens, cages, xv: marked }: Content) {
  const variant = variantFor({ cages, xv: marked });
  const grid = gridFromGivens(givens);
  const [solution] = enumerateSolutions(grid, 1, classicUnits, variant);
  const state = createState(grid, 9, classicUnits, variant && afterPlaceFor(variant));
  const techniques = techniquesFor(classicUnits, variant);
  while (state.grid.includes(0)) {
    expect(techniques.some((technique) => technique.apply(state))).toBe(true);
    solution.forEach((digit, index) => {
      const holds = state.grid[index]
        ? state.grid[index] === digit
        : (state.cand[index] & (1 << digit)) !== 0;
      expect(holds).toBe(true);
    });
  }
}

describe("soundness", () => {
  it.each([
    { name: "sudoku-killer", versions: sudokuKillerGenerators, difficulty: 3 },
    { name: "sudoku-killer", versions: sudokuKillerGenerators, difficulty: 5 },
    { name: "sudoku-xv", versions: sudokuXvGenerators, difficulty: 4 },
    { name: "sudoku-xv", versions: sudokuXvGenerators, difficulty: 5 },
  ] as const)("$name at $difficulty never removes the solution's digit", ({ versions, difficulty }) => {
    for (const seed of ["a", "b", "c"]) {
      keepsSolution(versions[1](seed, difficulty).content);
    }
  }, 120_000);
});
