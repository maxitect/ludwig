import { describe, expect, it } from "vitest";
import { difficulties } from "../_shared/generate/pipeline";
import { countSolutions, gridFromGivens } from "./engine";
import { sudokuGenerators } from "./generate";
import { gradeSudoku } from "./grade";
import { contentSchema } from "./schema";

describe("sudoku generator", () => {
  it("is deterministic for a seed, version and difficulty", () => {
    const first = sudokuGenerators[1]("same", 3);
    expect(sudokuGenerators[1]("same", 3)).toEqual(first);
    expect(sudokuGenerators[1]("other", 3).content).not.toEqual(first.content);
  });

  it("gives 180 degree symmetric givens", () => {
    for (const difficulty of difficulties) {
      const { content } = sudokuGenerators[1]("symmetry", difficulty);
      const cells = new Set(content.givens.map(({ row, col }) => row * 9 + col));
      for (const cell of cells) expect(cells.has(80 - cell)).toBe(true);
    }
  });

  it("has no version 2 yet", () => {
    expect(Object.hasOwn(sudokuGenerators, 2)).toBe(false);
  });

  it("produces unique puzzles solvable by technique alone, at the requested difficulty (200 seeds)", () => {
    for (let index = 0; index < 200; index++) {
      const difficulty = difficulties[index % difficulties.length];
      const { content } = sudokuGenerators[1](`property-${index}`, difficulty);
      expect(contentSchema.safeParse(content).success).toBe(true);
      expect(countSolutions(content.givens, 2)).toBe(1);
      expect(gradeSudoku(gridFromGivens(content.givens))?.difficulty).toBe(
        difficulty,
      );
    }
  }, 120_000);
});
