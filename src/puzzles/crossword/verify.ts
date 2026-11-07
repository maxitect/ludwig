import {
  cellKey,
  type CellKey,
  type CellPosition,
} from "../_shared/cell-grid/navigation";
import { deriveAnswer, deriveRuns, runCells, type ClueStart, type Run } from "./derive";
import type { Content } from "./schema";
import { GRID_STANDARDS, gridWords, measureGrid, sharesRoot } from "./standards";

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

const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

function gridStandardProblems({ style, rows, cols, cells }: Content) {
  const problems: string[] = [];
  const keys = new Set(cells.map(({ row, col }) => cellKey(row, col)));
  const asymmetric = cells.filter(
    ({ row, col }) => !keys.has(cellKey(rows - 1 - row, cols - 1 - col)),
  );
  if (asymmetric.length) {
    const { row, col } = asymmetric[0];
    problems.push(
      `the grid is not rotationally symmetric (row ${row + 1}, column ${col + 1} has no partner)`,
    );
  }

  const { runs, counts, checkedRatio, blackRatio, entries } = measureGrid({
    rows,
    cols,
    cells,
  });
  for (const run of runs) {
    if (run.length < GRID_STANDARDS.minEntryLength) {
      problems.push(`${describeRun(run)} is only ${run.length} letters`);
    }
  }

  if (style === "mini") {
    const { minCheckedRatio, maxEntries } = GRID_STANDARDS.mini;
    if (checkedRatio < minCheckedRatio) {
      problems.push(
        `${percent(checkedRatio)} of letters are checked, a mini needs at least ${percent(minCheckedRatio)}`,
      );
    }
    if (entries > maxEntries) {
      problems.push(`${entries} entries, a mini has at most ${maxEntries}`);
    }
  } else {
    const { checkedRatio: range, maxBlackRatio } = GRID_STANDARDS.blocked;
    if (checkedRatio < range.min || checkedRatio > range.max) {
      problems.push(
        `${percent(checkedRatio)} of letters are checked, ${style} grids need ${percent(range.min)} to ${percent(range.max)}`,
      );
    }
    if (blackRatio > maxBlackRatio) {
      problems.push(
        `${percent(blackRatio)} of the grid is black, at most ${percent(maxBlackRatio)}`,
      );
    }
    for (const run of runs) {
      const checked = runCells(run).filter(
        ({ row, col }) => (counts.get(cellKey(row, col)) ?? 0) > 1,
      ).length;
      if (checked === 0) problems.push(`${describeRun(run)} has no checked letter`);
      if (checked === run.length) {
        problems.push(`${describeRun(run)} is fully checked`);
      }
    }
  }

  const words = gridWords(cells);
  words.forEach((word, i) => {
    for (const other of words.slice(i + 1)) {
      if (word === other) problems.push(`${word} appears twice`);
      else if (sharesRoot(word, other)) {
        problems.push(`${word} and ${other} share a root`);
      }
    }
  });
  return problems;
}

/**
 * Every white run of two or more cells has exactly one clue and every clue starts a run.
 * Each clue's segments add up to its run, no clue contains its own answer, and the white cells are connected.
 * The grid meets the standards of its style (`GRID_STANDARDS`).
 * The letters are stored, so the single solution is the grid itself.
 */
export function verifyCrossword(content: Content) {
  const { rows, cols, cells, clues } = content;
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
  throwIfAny(gridStandardProblems(content));
}
