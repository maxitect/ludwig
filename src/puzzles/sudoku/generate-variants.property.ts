import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { classicUnits, gridFromGivens, variantFor } from "./engine";
import { sudokuKillerGenerators, sudokuXvGenerators } from "./generate-variants";
import { gradeSudoku } from "./grade";
import { verifySudoku } from "./verify";

const generators = {
  "sudoku-killer": sudokuKillerGenerators,
  "sudoku-xv": sudokuXvGenerators,
};

export const VARIANT_SLICES = 10;

export function variantsProperty(slice: number) {
  propertySlice(
    ["sudoku-killer", "sudoku-xv"] as const,
    { seeds: 100, batch: 10, slices: VARIANT_SLICES },
    slice,
    (name, seed, difficulty) => {
      const { content } = generators[name][1](seed, difficulty);
      verifySudoku(content);
      expect(
        gradeSudoku(
          gridFromGivens(content.givens),
          5,
          classicUnits,
          variantFor({ cages: content.cages, xv: content.xv }),
        )?.difficulty,
      ).toBe(difficulty);
    },
  );
}
