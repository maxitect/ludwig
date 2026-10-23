import { cellKey } from "../_shared/cell-grid/navigation";
import { deriveClues, deriveRuns, runCells, type Run } from "./derive";
import { countSolutions } from "./engine";
import type { Content } from "./schema";

const describe = ({ direction, row, col }: Run) =>
  `${direction} run at row ${row + 1}, column ${col + 1}`;

/**
 * Every white cell sits in both an across and a down run, each run is 2 to 9 cells with its clue
 * cell on the grid, no run repeats a digit, and the clues have exactly one solution.
 */
export function verifyKakuro({ cells }: Content) {
  const digits = new Map<string, number>();
  for (const { row, col, digit } of cells) {
    const key = cellKey(row, col);
    if (digits.has(key)) {
      throw new Error(`duplicate cell at row ${row + 1}, column ${col + 1}`);
    }
    digits.set(key, digit);
  }

  const problems: string[] = [];
  for (const run of deriveRuns(cells)) {
    if (run.length < 2) {
      problems.push(`${describe(run)} is a single cell`);
      continue;
    }
    if (run.length > 9) problems.push(`${describe(run)} is ${run.length} cells`);
    const before = run.direction === "across" ? run.col : run.row;
    if (before === 0) problems.push(`${describe(run)} has no clue cell before it`);
    const seen = new Set<number>();
    for (const { row, col } of runCells(run)) {
      const digit = digits.get(cellKey(row, col))!;
      if (seen.has(digit)) {
        problems.push(`${describe(run)} repeats ${digit}`);
        break;
      }
      seen.add(digit);
    }
  }
  if (problems.length) throw new Error(problems.join("; "));

  const solutions = countSolutions({ cells, clues: deriveClues(cells) }, 2);
  if (solutions !== 1) {
    throw new Error(
      solutions === 0
        ? "the puzzle has no solution"
        : "the puzzle has more than one solution",
    );
  }
}
