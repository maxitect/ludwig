import {
  cellKey,
  DIRECTION_STEP,
  type CellKey,
  type CellPosition,
} from "../_shared/cell-grid/navigation";
import type { Payload, Solution } from "./schema";

type Clue = Payload["clues"][number];

export type ClueStart = Pick<Clue, "direction" | "row" | "col">;

export type Run = ClueStart & { length: number };

export type Entry = Run &
  Pick<Clue, "clueText" | "segments"> & {
    number: number;
    enumeration: string;
    cells: CellPosition[];
  };

/** The cells of a run, from its start. */
export function runCells({ direction, row, col, length }: Run) {
  const step = DIRECTION_STEP[direction];
  return Array.from({ length }, (_, i) => ({
    row: row + step.row * i,
    col: col + step.col * i,
  }));
}

/** Every maximal white run of two or more cells, ordered by start cell in reading order, across before down. */
export function deriveRuns(cells: ReadonlyArray<CellPosition>): Run[] {
  const white = new Set(cells.map(({ row, col }) => cellKey(row, col)));
  const runs: Run[] = [];
  for (const direction of ["across", "down"] as const) {
    const step = DIRECTION_STEP[direction];
    for (const { row, col } of cells) {
      if (white.has(cellKey(row - step.row, col - step.col))) continue;
      let length = 0;
      while (white.has(cellKey(row + step.row * length, col + step.col * length))) {
        length++;
      }
      if (length >= 2) runs.push({ direction, row, col, length });
    }
  }
  return runs.sort(
    (a, b) =>
      a.row - b.row ||
      a.col - b.col ||
      (a.direction === b.direction ? 0 : a.direction === "across" ? -1 : 1),
  );
}

/** Clue numbers by start cell: reading order, one number per cell that starts any run. */
export function deriveNumbers(runs: ReadonlyArray<Run>) {
  const numbers = new Map<CellKey, number>();
  for (const { row, col } of runs) {
    const key = cellKey(row, col);
    if (!numbers.has(key)) numbers.set(key, numbers.size + 1);
  }
  return numbers;
}

const SEPARATOR_MARK = { word: ",", hyphen: "-" } as const;

/** The "(3,4-5)" enumeration of a clue's segments, each followed by its separator. */
export function deriveEnumeration(segments: Clue["segments"]) {
  const body = segments
    .map(({ length, separator }, i) => {
      if (i === segments.length - 1) return length;
      if (!separator) throw new Error("a segment before the last has no separator");
      return `${length}${SEPARATOR_MARK[separator]}`;
    })
    .join("");
  return `(${body})`;
}

/** The numbered entries of a puzzle, each paired with its clue. A run without a clue is left out. */
export function deriveEntries({ cells, clues }: Pick<Payload, "cells" | "clues">) {
  const runs = deriveRuns(cells);
  const numbers = deriveNumbers(runs);
  const entries: Entry[] = [];
  for (const run of runs) {
    const clue = clues.find(
      (c) => c.direction === run.direction && c.row === run.row && c.col === run.col,
    );
    if (!clue) continue;
    entries.push({
      ...run,
      clueText: clue.clueText,
      segments: clue.segments,
      number: numbers.get(cellKey(run.row, run.col)) ?? 0,
      enumeration: deriveEnumeration(clue.segments),
      cells: runCells(run),
    });
  }
  return entries;
}

/** The answer word of a run, read from the solution cells. Empty positions read as "?". */
export function deriveAnswer(solution: Solution, run: Run) {
  const letters = new Map(
    solution.map(({ row, col, letter }) => [cellKey(row, col), letter]),
  );
  return runCells(run)
    .map(({ row, col }) => letters.get(cellKey(row, col)) ?? "?")
    .join("");
}

/** The word map `CellGrid` takes for Tab navigation: one direction's entries in number order. */
export function deriveWords(entries: ReadonlyArray<Entry>, direction: Entry["direction"]) {
  return entries
    .filter((entry) => entry.direction === direction)
    .sort((a, b) => a.number - b.number)
    .map((entry) => entry.cells);
}
