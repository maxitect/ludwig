import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { deriveClues } from "./derive";
import { countSolutions } from "./engine";
import { kakuroGenerators } from "./generate";
import { solveKakuro } from "./grade";
import { verifyKakuro } from "./verify";

export const KAKURO_SLICES = 4;

export function kakuroProperty(slice: number) {
  propertySlice(
    ["kakuro"] as const,
    { seeds: 100, batch: 10, slices: KAKURO_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = kakuroGenerators[1](seed, difficulty);
      verifyKakuro(content);
      const clues = deriveClues(content.cells);
      expect(countSolutions({ cells: content.cells, clues }, 2)).toBe(1);
      const solved = solveKakuro({ cells: content.cells, clues });
      expect(solved.grade?.difficulty).toBe(difficulty);
      expect(solved.digits).toEqual(content.cells.map(({ digit }) => digit));
    },
  );
}
