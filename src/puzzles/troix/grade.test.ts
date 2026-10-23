import { describe, expect, it } from "vitest";
import { countSolutions, SYMBOLS } from "./engine";
import { gradeTroix, solveTroix } from "./grade";
import type { Content } from "./schema";

const fromRows = (rows: ReadonlyArray<string>): Content => ({
  size: rows.length === 6 ? 6 : 9,
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

  it("grades a frozen 9 by 9 puzzle needing three line arrangements as 5 and stops at 4", () => {
    const puzzle = fromRows([
      "IO..IO.I.",
      "X...O.X.I",
      ".OO..I.XI",
      "OII.IO...",
      "..II..XIX",
      "X....I...",
      "OI....X..",
      ".....I..I",
      "..I......",
    ]);
    expect(countSolutions(puzzle, 2)).toBe(1);
    const grade = gradeTroix(puzzle);
    expect(grade).toMatchObject({
      difficulty: 5,
      hardest: "line arrangements",
    });
    expect(grade?.uses["line arrangements"]).toBe(3);
    expect(gradeTroix(puzzle, 4)).toBeNull();
  });

  it("returns null when techniques cannot finish an empty grid", () => {
    expect(gradeTroix({ size: 6, givens: [] })).toBeNull();
  });
});
