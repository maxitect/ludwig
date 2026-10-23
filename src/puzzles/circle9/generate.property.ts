import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { countSolutions, layoutOf } from "./engine";
import { circle9Generators } from "./generate";
import { solveCircle9 } from "./grade";
import { numbers } from "./verify";

export const CIRCLE9_SLICES = 2;

export function circle9Property(slice: number) {
  propertySlice(
    ["circle9"] as const,
    { seeds: 100, batch: 25, slices: CIRCLE9_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = circle9Generators[1](seed, difficulty);
      const layout = layoutOf({ numbers: numbers(content) });
      expect(countSolutions(layout)).toBe(1);
      expect(solveCircle9(layout)?.grade.difficulty).toBe(difficulty);
    },
  );
}
