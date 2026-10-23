import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { countSolutions } from "./engine";
import { railroadGenerators } from "./generate";
import { solveRailroad } from "./grade";
import { verifyRailroad } from "./verify";

export const RAILROAD_SLICES = 4;

export function railroadProperty(slice: number) {
  propertySlice(
    ["railroad"] as const,
    { seeds: 100, batch: 25, slices: RAILROAD_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = railroadGenerators[1](seed, difficulty);
      verifyRailroad(content);
      expect(countSolutions(content)).toBe(1);
      expect(solveRailroad(content)?.grade.difficulty).toBe(difficulty);
    },
  );
}
