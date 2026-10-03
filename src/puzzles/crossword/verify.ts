import {
  cellKey,
  type CellKey,
  type CellPosition,
} from "../_shared/cell-grid/navigation";
import { deriveAnswer, deriveRuns, type ClueStart, type Run } from "./derive";
import type { Content } from "./schema";

const describeRun = ({ direction, row, col }: ClueStart) =>
  `${direction} run at row ${row + 1}, column ${col + 1}`;

const sameStart = (a: ClueStart, b: ClueStart) =>
  a.direction === b.direction && a.row === b.row && a.col === b.col;

const NEIGHBOURS = [
  { row: 1, col: 0 },
  { row: -1, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: -1 },
];

function throwIfAny(problems: string[]) {
  if (problems.length) throw new Error(problems.join("; "));
}

/**
 * Every white run of two or more cells has exactly one clue and every clue starts a run.
 * Each clue's segments add up to its run, no clue contains its own answer, and the white cells are connected.
 * The letters are stored, so the single solution is the grid itself.
 */
export function verifyCrossword({ rows, cols, cells, clues }: Content) {
  const problems: string[] = [];
  const keys = new Set<CellKey>();
  for (const { row, col } of cells) {
    const key = cellKey(row, col);
    if (row >= rows || col >= cols) {
      problems.push(
        `cell at row ${row + 1}, column ${col + 1} is outside the grid`,
      );
    }
    if (keys.has(key)) {
      problems.push(`duplicate cell at row ${row + 1}, column ${col + 1}`);
    }
    keys.add(key);
  }
  throwIfAny(problems);

  const runs = deriveRuns(cells);
  for (const run of runs) {
    const matching = clues.filter((clue) => sameStart(clue, run));
    if (matching.length !== 1) {
      problems.push(`${describeRun(run)} has ${matching.length} clues`);
    }
  }
  for (const clue of clues) {
    const run: Run | undefined = runs.find((r) => sameStart(r, clue));
    if (!run) {
      problems.push(`clue at ${describeRun(clue)} does not start a run`);
      continue;
    }
    const total = clue.segments.reduce((sum, length) => sum + length, 0);
    if (total !== run.length) {
      problems.push(
        `${describeRun(run)}: segments add up to ${total}, the run is ${run.length}`,
      );
    }
    const answer = deriveAnswer(cells, run);
    if (new RegExp(`\\b${answer}\\b`).test(clue.clueText.toUpperCase())) {
      problems.push(`${describeRun(run)}: the clue contains its answer ${answer}`);
    }
  }

  const queue: CellPosition[] = [cells[0]];
  const seen = new Set<CellKey>([cellKey(cells[0].row, cells[0].col)]);
  for (const { row, col } of queue) {
    for (const step of NEIGHBOURS) {
      const next = { row: row + step.row, col: col + step.col };
      const key = cellKey(next.row, next.col);
      if (keys.has(key) && !seen.has(key)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  if (seen.size !== keys.size) problems.push("the grid is not connected");
  throwIfAny(problems);
}
