import { expect } from "vitest";
import { propertySlice } from "../_shared/generate/property";
import { brokenIndexes, countSolutions } from "./engine";
import { fillominoGenerators } from "./generate";
import { solveFillomino } from "./grade";
import { verifyFillomino } from "./verify";

export const FILLOMINO_SLICES = 3;

/** The exact search settles an 8 by 8 grid in milliseconds; on 10 by 10 the grader's fill is the proof. */
const EXACT_ROWS = 8;

export function fillominoProperty(slice: number) {
  propertySlice(
    ["fillomino"] as const,
    { seeds: 100, batch: 25, slices: FILLOMINO_SLICES },
    slice,
    (_, seed, difficulty) => {
      const { content } = fillominoGenerators[1](seed, difficulty);
      verifyFillomino(content);
      if (content.rows === EXACT_ROWS) {
        expect(countSolutions(content, 2)).toBe(1);
      }
      const solved = solveFillomino(content);
      expect(solved?.grade?.difficulty).toBe(difficulty);
      const cells = solved?.cells ?? [];
      expect(cells).toHaveLength(content.rows * content.cols);
      expect(brokenIndexes(content, cells).size).toBe(0);
      for (const { row, col, digit } of content.givens) {
        expect(cells[row * content.cols + col]).toBe(digit);
      }
    },
  );
}
