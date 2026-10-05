import { cellKey } from "../_shared/cell-grid/navigation";
import { countSolutions } from "./engine";
import type { Content } from "./schema";

/** The givens occupy distinct cells and have exactly one completion. */
export function verifySudoku({ givens }: Content) {
  const seen = new Set<string>();
  for (const { row, col } of givens) {
    const key = cellKey(row, col);
    if (seen.has(key)) {
      throw new Error(`duplicate given at row ${row + 1}, column ${col + 1}`);
    }
    seen.add(key);
  }
  const solutions = countSolutions(givens, 2);
  if (solutions !== 1) {
    throw new Error(
      solutions === 0
        ? "the givens have no solution"
        : "the givens have more than one solution",
    );
  }
}
