import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { gridFromGivens, unitsFor } from "./engine";
import { sudokuJigsawGenerators, sudokuRainbowGenerators } from "./generate-regions";
import { gradeSudoku } from "./grade";
import { verifySudoku } from "./verify";

const generators = {
  "sudoku-jigsaw": sudokuJigsawGenerators,
  "sudoku-rainbow": sudokuRainbowGenerators,
};

export const REGION_SLICES = 2;

export function regionsProperty(slice: number) {
  propertySlice(
    ["sudoku-jigsaw", "sudoku-rainbow"] as const,
    { seeds: 100, batch: 25, slices: REGION_SLICES },
    slice,
    (name, seed, difficulty) => {
      const { content } = generators[name][1](seed, difficulty);
      verifySudoku(content);
      expect(
        gradeSudoku(gridFromGivens(content.givens), 5, unitsFor(content.regions))
          ?.difficulty,
      ).toBe(difficulty);
    },
  );
}
