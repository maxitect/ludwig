import { cellKey, type CellPosition } from "../_shared/cell-grid/navigation";
import type { Clue, Solution } from "./schema";

export type Direction = Clue["direction"];

/** A maximal horizontal or vertical stretch of white cells, starting at `row`, `col`. */
export type Run = { direction: Direction; row: number; col: number; length: number };

const STEP: Record<Direction, CellPosition> = {
  across: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
};

export function runCells({ direction, row, col, length }: Run): CellPosition[] {
  const step = STEP[direction];
  return Array.from({ length }, (_, i) => ({
    row: row + step.row * i,
    col: col + step.col * i,
  }));
}

/** Every maximal stretch of white cells in both directions, including single cells. */
export function deriveRuns(cells: ReadonlyArray<CellPosition>): Run[] {
  const white = new Set(cells.map(({ row, col }) => cellKey(row, col)));
  const runs: Run[] = [];
  for (const direction of ["across", "down"] as const) {
    const step = STEP[direction];
    for (const { row, col } of cells) {
      if (white.has(cellKey(row - step.row, col - step.col))) continue;
      let length = 1;
      while (
        white.has(cellKey(row + step.row * length, col + step.col * length))
      ) {
        length++;
      }
      runs.push({ direction, row, col, length });
    }
  }
  return runs;
}

const byPosition = (a: Clue, b: Clue) =>
  a.row - b.row ||
  a.col - b.col ||
  (a.direction === b.direction ? 0 : a.direction === "across" ? -1 : 1);

/** The clues of every run of two or more cells: its length and the sum of its digits, in the black cell before it. */
export function deriveClues(solution: Solution): Clue[] {
  const digits = new Map(
    solution.map(({ row, col, digit }) => [cellKey(row, col), digit]),
  );
  return deriveRuns(solution)
    .filter(({ length }) => length >= 2)
    .map((run) => ({
      direction: run.direction,
      row: run.row - STEP[run.direction].row,
      col: run.col - STEP[run.direction].col,
      length: run.length,
      sum: runCells(run).reduce(
        (total, { row, col }) => total + (digits.get(cellKey(row, col)) ?? 0),
        0,
      ),
    }))
    .sort(byPosition);
}

/** The run a clue governs. */
export function clueRun({ direction, row, col, length }: Clue): Run {
  const step = STEP[direction];
  return { direction, row: row + step.row, col: col + step.col, length };
}
