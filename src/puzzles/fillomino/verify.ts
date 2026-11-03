import { cellKey } from "../_shared/cell-grid/navigation";
import { countSolutions } from "./engine";
import { solveFillomino } from "./grade";
import type { Content } from "./schema";

/**
 * Givens occupy distinct cells, and the puzzle has exactly one completion: either the techniques of
 * the grader fill the grid (each deduction is forced, so that is a proof), or a search finds one.
 */
export function verifyFillomino(content: Content) {
  const seen = new Set<string>();
  for (const { row, col } of content.givens) {
    const key = cellKey(row, col);
    if (seen.has(key)) {
      throw new Error(`duplicate given at row ${row + 1}, column ${col + 1}`);
    }
    seen.add(key);
  }
  if (solveFillomino(content)?.cells) return;
  const solutions = countSolutions(content, 2);
  if (solutions !== 1) {
    throw new Error(
      solutions === 0
        ? "the puzzle has no solution"
        : "the puzzle has more than one solution",
    );
  }
}
