import { describe, expect, it } from "vitest";
import { countSolutions, SYMBOLS } from "./engine";
import { gradeTroix, solveTroix } from "./grade";
import type { Content } from "./schema";

const fromRows = (rows: ReadonlyArray<string>): Content => ({
  size: rows.length,
  givens: rows.flatMap((line, row) =>
    [...line].flatMap((letter, col) =>
      letter === "."
        ? []
        : [{ row, col, symbol: SYMBOLS[["X", "O", "I"].indexOf(letter)] }],
    ),
  ),
});

describe("troix grader", () => {
  it("grades a grid missing one cell as 1: the line at quota decides it", () => {
    const puzzle = fromRows([
      ".XOOII",
      "OOIIXX",
      "IIXXOO",
      "XXOOII",
      "OOIIXX",
      "IIXXOO",
    ]);
    expect(countSolutions(puzzle, 2)).toBe(1);
    const solved = solveTroix(puzzle);
    expect(solved?.grade).toMatchObject({
      difficulty: 1,
      hardest: "line at quota",
    });
    expect(solved?.grid.slice(0, 6)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("grades a frozen 9 by 9 puzzle as 5 and stops at 4", () => {
    const puzzle = fromRows([
      ".IOII...O",
      "..I.O..OI",
      ".X..X.OXO",
      "....O.XO.",
      ".XOO.I...",
      "X...IOI.I",
      "O.XX...XO",
      "X..XX....",
      "I.....I..",
    ]);
    expect(countSolutions(puzzle, 2)).toBe(1);
    expect(gradeTroix(puzzle)).toMatchObject({
      difficulty: 5,
      hardest: "contradiction",
    });
    expect(gradeTroix(puzzle, 4)).toBeNull();
  });

  it("returns null when techniques cannot finish an empty grid", () => {
    expect(gradeTroix({ size: 6, givens: [] })).toBeNull();
  });
});
