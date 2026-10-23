import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { solve, toSolution } from "./engine";
import { troixGenerators } from "./generate";
import { solveTroix } from "./grade";
import { verifyTroix } from "./verify";

export const TROIX_SLICES = 2;

export function troixProperty(slice: number) {
  propertySlice(
    ["troix"] as const,
    { seeds: 100, batch: 25, slices: TROIX_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = troixGenerators[1](seed, difficulty);
      verifyTroix(content);
      const solved = solveTroix(content);
      expect(solved?.grade.difficulty).toBe(difficulty);
      expect(solved && toSolution(content.size, solved.grid)).toEqual(
        solve(content),
      );
    },
  );
}
