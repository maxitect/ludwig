import { describe, expect, it } from "vitest";
import { enumerateSolutions, type Units, unitsFor } from "./engine";
import { gradeSudoku } from "./grade";
import type { Regions } from "./schema";

const parse = (line: string) => [...line].map(Number);

const JIGSAW_REGIONS =
  "000012222330114222330144255330114255300164555331164557888664447888667777888666777";
const NEEDS_LEFTOVERS =
  "000000000007300060700200000000000010090602000000400000000000100003000790009180002";

const jigsaw = (line: string): Regions => ({
  kind: "jigsaw",
  cells: parse(line).map((region, index) => ({
    row: Math.floor(index / 9),
    col: index % 9,
    region,
  })),
});

const units: Units = unitsFor(jigsaw(JIGSAW_REGIONS));

describe("gradeSudoku on a jigsaw", () => {
  it("grades a nearly complete grid as 1", () => {
    const [solution] = enumerateSolutions(parse(NEEDS_LEFTOVERS), 1, units);
    const grid = [...solution];
    for (const index of [0, 40, 80]) grid[index] = 0;
    expect(gradeSudoku(grid, 5, units)).toMatchObject({
      difficulty: 1,
      hardest: "naked single",
    });
  });

  it("grades a puzzle that needs the law of leftovers as at least 4", () => {
    const grade = gradeSudoku(parse(NEEDS_LEFTOVERS), 5, units);
    expect(grade?.difficulty).toBeGreaterThanOrEqual(4);
    expect(grade?.uses["law of leftovers"]).toBeGreaterThan(0);
    expect(gradeSudoku(parse(NEEDS_LEFTOVERS), 3, units)).toBeNull();
  });

  it("has exactly one solution for that puzzle", () => {
    expect(enumerateSolutions(parse(NEEDS_LEFTOVERS), 2, units)).toHaveLength(1);
  });
});

describe("gradeSudoku on a rainbow", () => {
  it("grades a nearly complete grid as 1", () => {
    const groups: Regions = {
      kind: "rainbow",
      cells: Array.from({ length: 81 }, (_, index) => ({
        row: Math.floor(index / 9),
        col: index % 9,
        region: ((index % 9) + 3 * (Math.floor(index / 9) % 3) + Math.floor(index / 27)) % 9,
      })),
    };
    const rainbowUnits = unitsFor(groups);
    const [solution] = enumerateSolutions(
      parse(
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      ),
      1,
      rainbowUnits,
    );
    const grid = [...solution];
    for (const index of [3, 30, 77]) grid[index] = 0;
    expect(gradeSudoku(grid, 5, rainbowUnits)).toMatchObject({ difficulty: 1 });
  });
});
