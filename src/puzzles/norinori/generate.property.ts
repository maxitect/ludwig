import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { norinoriGenerators } from "./generate";
import { solveNorinori } from "./grade";
import { verifyNorinori } from "./verify";

export const NORINORI_SLICES = 3;

export function norinoriProperty(slice: number) {
  propertySlice(
    ["norinori"] as const,
    { seeds: 100, batch: 25, slices: NORINORI_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = norinoriGenerators[1](seed, difficulty);
      verifyNorinori(content);
      expect(solveNorinori(content)?.grade.difficulty).toBe(difficulty);
    },
  );
}
