import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { solve } from "./engine";
import { reflectionsGenerators } from "./generate";
import { solveReflections } from "./grade";
import { verifyReflections } from "./verify";

export const REFLECTIONS_SLICES = 5;

export function reflectionsProperty(slice: number) {
  propertySlice(
    ["reflections"] as const,
    { seeds: 100, batch: 5, slices: REFLECTIONS_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = reflectionsGenerators[1](seed, difficulty);
      verifyReflections(content);
      const solved = solveReflections(content);
      expect(solved?.grade?.difficulty).toBe(difficulty);
      expect(solved?.mirrors).toEqual(solve(content));
    },
  );
}
