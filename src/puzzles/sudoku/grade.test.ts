import { describe, expect, it } from "vitest";
import { bit, createState } from "../_shared/generate/candidates";
import { enumerateSolutions } from "./engine";
import { gradeSudoku, ladder } from "./grade";

const parse = (line: string) => [...line].map(Number);

const NAKED_SINGLES_ONLY =
  "090104703010000200200070490040602910000000000059407020081090002003000070502306040";
const NEEDS_X_WING =
  "687210500000094000490600001000000810700000003052000000100009082000160000009032174";

describe("gradeSudoku", () => {
  it("grades a puzzle that naked singles finish as 1", () => {
    expect(gradeSudoku(parse(NAKED_SINGLES_ONLY))).toMatchObject({
      difficulty: 1,
      hardest: "naked single",
    });
  });

  it("grades a puzzle that needs an x-wing as at least 4", () => {
    const grade = gradeSudoku(parse(NEEDS_X_WING));
    expect(grade?.difficulty).toBeGreaterThanOrEqual(4);
    expect(grade?.uses["x-wing"]).toBeGreaterThan(0);
  });

  it("returns null when the allowed techniques cannot finish the puzzle", () => {
    expect(gradeSudoku(parse(NEEDS_X_WING), 3)).toBeNull();
  });

  it("returns null for a puzzle with a single clue, which needs a guess", () => {
    const grid = Array(81).fill(0);
    grid[0] = 1;
    expect(gradeSudoku(grid)).toBeNull();
  });

  it("never removes the solution's digit from a cell while solving", () => {
    for (const line of [NAKED_SINGLES_ONLY, NEEDS_X_WING]) {
      const [solution] = enumerateSolutions(parse(line), 1);
      const state = createState(parse(line), 9, rowsColsBoxes());
      while (state.grid.includes(0)) {
        expect(ladder.some((technique) => technique.apply(state))).toBe(true);
        solution.forEach((digit, index) => {
          const holds = state.grid[index]
            ? state.grid[index] === digit
            : (state.cand[index] & bit(digit)) !== 0;
          expect(holds).toBe(true);
        });
      }
    }
  });
});

describe("x-wing", () => {
  it("clears the digit from the cover columns outside the base rows", () => {
    const xWing = ladder.find(({ name }) => name === "x-wing");
    const state = createState(Array(81).fill(0), 9, rowsColsBoxes());
    const digit = 4;
    for (const row of [1, 5]) {
      for (let col = 0; col < 9; col++) {
        if (col !== 2 && col !== 6) state.cand[row * 9 + col] &= ~bit(digit);
      }
    }
    expect(xWing?.apply(state)).toBe(true);
    for (let row = 0; row < 9; row++) {
      for (const col of [2, 6]) {
        const has = (state.cand[row * 9 + col] & bit(digit)) !== 0;
        expect(has).toBe(row === 1 || row === 5);
      }
    }
  });
});

function rowsColsBoxes() {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) {
    units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  }
  for (let c = 0; c < 9; c++) {
    units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  }
  for (let b = 0; b < 9; b++) {
    units.push(
      Array.from(
        { length: 9 },
        (_, k) =>
          (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 +
          (b % 3) * 3 +
          (k % 3),
      ),
    );
  }
  return units;
}
