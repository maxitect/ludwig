import { describe, expect, it } from "vitest";
import { content as doubleBill } from "../../../content/star-battle/double-bill";
import { countSolutions, solve } from "./engine";
import { gradeStarBattle, solveStarBattle } from "./grade";
import { regionCells } from "./verify";

const easy = {
  size: 5,
  stars: 1,
  grid: ["00001", "00111", "00012", "33342", "44442"],
};

const hard = {
  size: 10,
  stars: 1,
  grid: [
    "3333100222",
    "3331104422",
    "3333404442",
    "6633444555",
    "6666455555",
    "8666559955",
    "8666659995",
    "8886779995",
    "8777779995",
    "7779999995",
  ],
};

const layout = ({ size, stars, grid }: typeof easy) => ({
  size,
  stars,
  regionOf: regionCells({ grid }).map(({ region }) => region),
});

describe("gradeStarBattle", () => {
  it("grades a puzzle that saturated units and one region in a line finish as 1", () => {
    expect(countSolutions(layout(easy), 2)).toBe(1);
    expect(gradeStarBattle(easy)).toMatchObject({ difficulty: 1 });
  });

  it("grades a puzzle that needs a counting argument over three lines or regions as 5, and null below it", () => {
    expect(countSolutions(layout(hard), 2)).toBe(1);
    const grade = gradeStarBattle(hard);
    expect(grade?.difficulty).toBe(5);
    expect(grade?.uses["3 lines or regions"]).toBeGreaterThan(0);
    expect(gradeStarBattle(hard, 4)).toBeNull();
  });

  it("places exactly the stars of the unique solution", () => {
    for (const content of [easy, hard, doubleBill]) {
      expect(solveStarBattle(content)?.stars).toEqual(
        solve(layout(content))?.toSorted((a, b) => a - b),
      );
    }
  });

  it("returns null for a puzzle with several solutions, which needs a guess", () => {
    const loose = { size: 5, stars: 1, grid: ["00000", "11111", "22222", "33333", "44444"] };
    expect(countSolutions(layout(loose), 2)).toBe(2);
    expect(gradeStarBattle(loose)).toBeNull();
  });
});
