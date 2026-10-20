import type { Payload } from "./schema";

export const UNKNOWN = 0;
export const FILLED = 1;
export const EMPTY = 2;

export type Clues = Pick<Payload, "rowClues" | "colClues">;
type Line = readonly number[];

/**
 * What a line's cells must be in every arrangement of its runs that agrees with the cells already known:
 * `null` when no arrangement does, otherwise the line with every forced cell set.
 */
export function solveLine(clue: readonly number[], line: Line): number[] | null {
  const n = line.length;
  const k = clue.length;
  const canRun = (at: number, length: number) => {
    if (at + length > n) return false;
    for (let i = at; i < at + length; i++) if (line[i] === EMPTY) return false;
    return at + length === n || line[at + length] !== FILLED;
  };
  const after = (at: number, run: number) => Math.min(n, at + clue[run] + 1);

  // fits[i * (k + 1) + j]: cells i.. can hold runs j.. when cell i starts a free stretch
  const fits = new Uint8Array((n + 1) * (k + 1));
  const at = (i: number, j: number) => i * (k + 1) + j;
  fits[at(n, k)] = 1;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = k; j >= 0; j--) {
      const blank = line[i] !== FILLED && fits[at(i + 1, j)] === 1;
      const run = j < k && canRun(i, clue[j]) && fits[at(after(i, j), j + 1)] === 1;
      if (blank || run) fits[at(i, j)] = 1;
    }
  }
  if (!fits[at(0, 0)]) return null;

  const mayFill = new Uint8Array(n);
  const mayEmpty = new Uint8Array(n);
  const reached = new Uint8Array((n + 1) * (k + 1));
  reached[at(0, 0)] = 1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= k; j++) {
      if (!reached[at(i, j)] || !fits[at(i, j)]) continue;
      if (line[i] !== FILLED && fits[at(i + 1, j)]) {
        mayEmpty[i] = 1;
        reached[at(i + 1, j)] = 1;
      }
      if (j < k && canRun(i, clue[j]) && fits[at(after(i, j), j + 1)]) {
        for (let c = i; c < i + clue[j]; c++) mayFill[c] = 1;
        if (i + clue[j] < n) mayEmpty[i + clue[j]] = 1;
        reached[at(after(i, j), j + 1)] = 1;
      }
    }
  }
  return line.map((cell, i) =>
    cell !== UNKNOWN ? cell : mayFill[i] && !mayEmpty[i] ? FILLED : !mayFill[i] ? EMPTY : UNKNOWN,
  );
}

/** Applies `solveLine` to every row and column until nothing more is forced. `null` on a contradiction. */
export function propagate({ rowClues, colClues }: Clues, grid: Line): number[] | null {
  const rows = rowClues.length;
  const cols = colClues.length;
  const next = [...grid];
  for (let changed = true; changed; ) {
    changed = false;
    for (let row = 0; row < rows; row++) {
      const line = next.slice(row * cols, (row + 1) * cols);
      const solved = solveLine(rowClues[row], line);
      if (!solved) return null;
      solved.forEach((cell, col) => {
        if (cell !== line[col]) {
          next[row * cols + col] = cell;
          changed = true;
        }
      });
    }
    for (let col = 0; col < cols; col++) {
      const line = Array.from({ length: rows }, (_, row) => next[row * cols + col]);
      const solved = solveLine(colClues[col], line);
      if (!solved) return null;
      solved.forEach((cell, row) => {
        if (cell !== line[row]) {
          next[row * cols + col] = cell;
          changed = true;
        }
      });
    }
  }
  return next;
}

/**
 * Up to `limit` pictures that satisfy the clues, found by line propagation and then by trying both values of
 * the first undecided cell. Each is `rows * cols` cells, `FILLED` or `EMPTY`, row by row.
 */
export function solutions({ rowClues, colClues }: Clues, limit = Infinity) {
  const total = (clues: number[][]) =>
    clues.reduce((sum, clue) => sum + clue.reduce((a, b) => a + b, 0), 0);
  const found: number[][] = [];
  if (total(rowClues) !== total(colClues)) return found;

  const search = (grid: Line) => {
    const settled = propagate({ rowClues, colClues }, grid);
    if (!settled || found.length >= limit) return;
    const open = settled.indexOf(UNKNOWN);
    if (open === -1) {
      found.push(settled);
      return;
    }
    for (const value of [FILLED, EMPTY]) {
      search(settled.map((cell, i) => (i === open ? value : cell)));
    }
  };
  search(Array<number>(rowClues.length * colClues.length).fill(UNKNOWN));
  return found;
}

/** How many pictures satisfy the clues, counting no further than `limit`. */
export const countSolutions = (clues: Clues, limit = 2) =>
  solutions(clues, limit).length;

/** The picture's shaded cells, solved from the clues, or null when none fits. */
export function solve(clues: Clues) {
  const grid = solutions(clues, 1)[0];
  if (!grid) return null;
  const cols = clues.colClues.length;
  return grid.flatMap((cell, i) =>
    cell === FILLED ? [{ row: Math.floor(i / cols), col: i % cols }] : [],
  );
}
