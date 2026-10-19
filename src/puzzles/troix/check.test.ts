import { describe, expect, it } from "vitest";
import { content as theThirdSymbol } from "../../../content/troix/the-third-symbol";
import { check } from "./check";
import { solve } from "./engine";
import { payload, solution } from "./fixture";
import type { Answer, Payload } from "./schema";

const withCell = (
  cells: Answer["cells"],
  row: number,
  col: number,
  symbol: Answer["cells"][number]["symbol"],
) =>
  cells.map((cell) =>
    cell.row === row && cell.col === col ? { ...cell, symbol } : cell,
  );

const names = (wrongParts: { row: number; col: number }[]) =>
  wrongParts.map(({ row, col }) => `${row},${col}`);

describe("troix check", () => {
  it("accepts the solved grid", () => {
    expect(check(payload, solution, { cells: solution })).toEqual({
      correct: true,
      wrongParts: [],
    });
  });

  it("rejects a vertical run of three and names its cells", () => {
    const cells = withCell(solution, 4, 0, "o");
    const { correct, wrongParts } = check(payload, solution, { cells });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toEqual(
      expect.arrayContaining(["2,0", "3,0", "4,0"]),
    );
  });

  it("rejects a 9-wide row with four Xs and names the four X cells", () => {
    const solved = solve(theThirdSymbol)!;
    const payload9: Payload = { size: 9, givens: [] };
    const cells = solved.map((cell) => ({ ...cell }));
    const row0 = cells.filter(({ row }) => row === 0);
    const extra = row0.find(({ symbol }) => symbol !== "x")!;
    extra.symbol = "x";
    const crossed = row0
      .filter(({ symbol }) => symbol === "x")
      .map(({ col }) => `0,${col}`);
    expect(crossed).toHaveLength(4);
    const { correct, wrongParts } = check(payload9, solved, { cells });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toEqual(expect.arrayContaining(crossed));
  });

  it("rejects an overwritten given and names it", () => {
    const cells = withCell(solution, 0, 2, "x");
    const { correct, wrongParts } = check(payload, solution, { cells });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toContain("0,2");
  });

  it("names a cell left empty by an answer that omits it", () => {
    const cells = solution.filter(({ row, col }) => !(row === 5 && col === 5));
    const { correct, wrongParts } = check(payload, solution, { cells });
    expect(correct).toBe(false);
    expect(names(wrongParts)).toEqual(["5,5"]);
  });

  it("accepts any rule-abiding completion, since the puzzle has one", () => {
    const solved = solve(theThirdSymbol)!;
    expect(check(theThirdSymbol, solved, { cells: solved }).correct).toBe(true);
  });

  it("rejects every single-cell change to the solved grid", () => {
    for (const { row, col, symbol } of solution) {
      for (const other of ["x", "o", "i"] as const) {
        if (other === symbol) continue;
        const cells = withCell(solution, row, col, other);
        expect(check(payload, solution, { cells }).correct).toBe(false);
      }
    }
  });
});
