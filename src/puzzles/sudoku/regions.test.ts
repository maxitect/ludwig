import { describe, expect, it } from "vitest";
import { content as testCard } from "../../../content/sudoku/test-card";
import { content as tornEdges } from "../../../content/sudoku/torn-edges";
import { check } from "./check";
import { countSolutions, solve, unitsFor } from "./engine";
import { solution as classicSolution } from "./fixture";
import { regionLookup } from "./regions";
import { contentSchema, payloadSchema, type Content } from "./schema";
import { verifySudoku } from "./verify";

const variants = [
  ["jigsaw", tornEdges],
  ["rainbow", testCard],
] as const;

type RegionCells = NonNullable<Content["regions"]>["cells"];

const swapRegions = (cells: RegionCells, a: number, b: number) =>
  cells.map((cell, index) =>
    index === a
      ? { ...cell, region: cells[b].region }
      : index === b
        ? { ...cell, region: cells[a].region }
        : cell,
  );

describe.each(variants)("%s sudoku", (_kind, content) => {
  const units = unitsFor(content.regions);
  const payload = payloadSchema.parse(content);
  const shares = (
    a: { row: number; col: number },
    b: { row: number; col: number },
  ) =>
    units.some(
      (unit) => unit.includes(a.row * 9 + a.col) && unit.includes(b.row * 9 + b.col),
    );

  it("is a valid content file with exactly one completion", () => {
    expect(contentSchema.safeParse(content).success).toBe(true);
    expect(() => verifySudoku(content)).not.toThrow();
    expect(countSolutions(content.givens, 2, units)).toBe(1);
  });

  it("has 2+ solutions once a given is removed", () => {
    const loosened = content.givens
      .map((_, drop) => content.givens.slice(drop + 1))
      .find((givens) => countSolutions(givens, 2, units) === 2)!;
    expect(loosened).toBeDefined();
    expect(() => verifySudoku({ ...content, givens: loosened })).toThrow(
      /more than one/,
    );
  });

  it("has no solution when a given repeats a digit in a unit", () => {
    const [first, ...rest] = content.givens;
    const clash = rest.find(
      (given) => given.digit !== first.digit && shares(first, given),
    )!;
    const contradictory = content.givens.map((given) =>
      given === clash ? { ...given, digit: first.digit } : given,
    );
    expect(countSolutions(contradictory, 2, units)).toBe(0);
    expect(() => verifySudoku({ ...content, givens: contradictory })).toThrow(
      /no solution/,
    );
  });

  it("accepts its own solution and names a cell that breaks a unit", () => {
    const solved = solve(content.givens, units)!;
    expect(check(payload, solved, { cells: solved })).toEqual({
      correct: true,
      wrongParts: [],
    });
    const free = solved.find(
      (cell) =>
        !content.givens.some(
          ({ row, col }) => row === cell.row && col === cell.col,
        ),
    )!;
    const sibling = solved.find((cell) => cell !== free && shares(free, cell))!;
    const broken = solved.map((cell) =>
      cell === free ? { ...cell, digit: sibling.digit } : cell,
    );
    const result = check(payload, solved, { cells: broken });
    expect(result.correct).toBe(false);
    expect(result.wrongParts).toContainEqual({ row: free.row, col: free.col });
  });
});

describe("a grid that is a valid classic sudoku", () => {
  const payload = payloadSchema.parse({
    givens: [],
    regions: tornEdges.regions,
  });
  const region = regionLookup(payload.regions);

  it("breaks the jigsaw regions, which check names", () => {
    const result = check(payload, classicSolution, { cells: classicSolution });
    expect(result.correct).toBe(false);
    expect(result.wrongParts.length).toBeGreaterThan(0);
    for (const { row, col } of result.wrongParts) {
      const digit = classicSolution[row * 9 + col].digit;
      const repeats = classicSolution.some(
        (cell) =>
          (cell.row !== row || cell.col !== col) &&
          cell.digit === digit &&
          region(cell.row, cell.col) === region(row, col),
      );
      expect(repeats).toBe(true);
    }
  });

  it("is correct without regions", () => {
    expect(
      check({ givens: [] }, classicSolution, { cells: classicSolution })
        .correct,
    ).toBe(true);
  });
});

describe("verify and the schema reject a malformed region set", () => {
  it("rejects a jigsaw region that is not edge-connected", () => {
    const cells = swapRegions(tornEdges.regions.cells, 0, 80);
    expect(() =>
      verifySudoku({ ...tornEdges, regions: { kind: "jigsaw", cells } }),
    ).toThrow(/not edge-connected/);
  });

  it("does not require rainbow groups to be connected", () => {
    expect(() => verifySudoku(testCard)).not.toThrow();
  });

  it("rejects a region without nine cells", () => {
    const cells = tornEdges.regions.cells.map((cell, index) =>
      index === 0 ? { ...cell, region: (cell.region + 1) % 9 } : cell,
    );
    expect(() =>
      verifySudoku({ ...tornEdges, regions: { kind: "jigsaw", cells } }),
    ).toThrow(/not nine/);
  });

  it("rejects a repeated cell", () => {
    const cells = [...tornEdges.regions.cells];
    cells[1] = cells[0];
    expect(() =>
      verifySudoku({ ...tornEdges, regions: { kind: "jigsaw", cells } }),
    ).toThrow(/duplicate region cell/);
  });

  it("rejects fewer than 81 cells and a region outside 0 to 8", () => {
    expect(
      contentSchema.safeParse({
        ...tornEdges,
        regions: { kind: "jigsaw", cells: tornEdges.regions.cells.slice(1) },
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...tornEdges,
        regions: {
          kind: "jigsaw",
          cells: tornEdges.regions.cells.map((cell, index) =>
            index === 0 ? { ...cell, region: 9 } : cell,
          ),
        },
      }).success,
    ).toBe(false);
  });
});
