import type { Given, Solution, TroixSymbol } from "./schema";

export const SYMBOLS: readonly TroixSymbol[] = ["x", "o", "i"];

/** Row-major grid of `size * size` cells: 0 is empty, 1 to 3 are X, O and I. */
export type Grid = number[];

type Puzzle = { size: number; givens: ReadonlyArray<Given> };

export const symbolCode = (symbol: TroixSymbol) => SYMBOLS.indexOf(symbol) + 1;

export function gridFromGivens(
  size: number,
  givens: ReadonlyArray<Given>,
): Grid {
  const grid: Grid = Array(size * size).fill(0);
  for (const { row, col, symbol } of givens) {
    grid[row * size + col] = symbolCode(symbol);
  }
  return grid;
}

export function toSolution(size: number, grid: Grid): Solution {
  return grid.map((code, index) => ({
    row: Math.floor(index / size),
    col: index % size,
    symbol: SYMBOLS[code - 1],
  }));
}

/** The cell indexes of every row and column. */
function lines(size: number) {
  return Array.from({ length: 2 * size }, (_, line) =>
    Array.from({ length: size }, (_, at) =>
      line < size ? line * size + at : at * size + (line - size),
    ),
  );
}

/**
 * Indexes of filled cells that sit in a run of three alike, or that hold a symbol a row or column
 * has more of than its quota of `size / 3`.
 */
export function conflictingIndexes(size: number, grid: Grid) {
  const conflicts = new Set<number>();
  const quota = size / 3;
  for (const line of lines(size)) {
    const counts = [0, 0, 0, 0];
    for (const index of line) counts[grid[index]]++;
    for (const index of line) {
      if (grid[index] && counts[grid[index]] > quota) conflicts.add(index);
    }
    for (let at = 0; at + 2 < size; at++) {
      const [a, b, c] = [line[at], line[at + 1], line[at + 2]];
      if (grid[a] && grid[a] === grid[b] && grid[b] === grid[c]) {
        conflicts.add(a);
        conflicts.add(b);
        conflicts.add(c);
      }
    }
  }
  return conflicts;
}

/**
 * Finds up to `limit` completions by backtracking on the empty cell with the fewest candidates.
 * Contradictory givens yield none.
 */
export function enumerateSolutions(puzzle: Puzzle, limit: number) {
  const { size, givens } = puzzle;
  const grid = gridFromGivens(size, givens);
  if (conflictingIndexes(size, grid).size) return [];
  const quota = size / 3;
  const rowCounts = Array.from({ length: size }, () => [0, 0, 0, 0]);
  const colCounts = Array.from({ length: size }, () => [0, 0, 0, 0]);
  grid.forEach((code, index) => {
    rowCounts[Math.floor(index / size)][code]++;
    colCounts[index % size][code]++;
  });

  const at = (row: number, col: number) =>
    row < 0 || col < 0 || row >= size || col >= size ? -1 : grid[row * size + col];

  const makesRun = (row: number, col: number, code: number) => {
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
    ]) {
      for (let start = -2; start <= 0; start++) {
        let alike = true;
        for (let step = 0; step < 3; step++) {
          if (step === -start) continue;
          if (at(row + dr * (start + step), col + dc * (start + step)) !== code) {
            alike = false;
            break;
          }
        }
        if (alike) return true;
      }
    }
    return false;
  };

  const candidates = (index: number) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const codes: number[] = [];
    for (let code = 1; code <= 3; code++) {
      if (
        rowCounts[row][code] < quota &&
        colCounts[col][code] < quota &&
        !makesRun(row, col, code)
      ) {
        codes.push(code);
      }
    }
    return codes;
  };

  const found: Grid[] = [];
  function search() {
    let best = -1;
    let bestCodes: number[] = [];
    for (let index = 0; index < grid.length; index++) {
      if (grid[index]) continue;
      const codes = candidates(index);
      if (best === -1 || codes.length < bestCodes.length) {
        best = index;
        bestCodes = codes;
        if (codes.length <= 1) break;
      }
    }
    if (best === -1) {
      found.push([...grid]);
      return;
    }
    const row = Math.floor(best / size);
    const col = best % size;
    for (const code of bestCodes) {
      if (found.length >= limit) return;
      grid[best] = code;
      rowCounts[row][code]++;
      colCounts[col][code]++;
      search();
      grid[best] = 0;
      rowCounts[row][code]--;
      colCounts[col][code]--;
    }
  }

  search();
  return found;
}

/** Number of completions, counted only up to `limit`. */
export function countSolutions(puzzle: Puzzle, limit = 2): number {
  return enumerateSolutions(puzzle, limit).length;
}

/** The first completion of the puzzle, or null when there is none. */
export function solve(puzzle: Puzzle): Solution | null {
  const [first] = enumerateSolutions(puzzle, 1);
  return first ? toSolution(puzzle.size, first) : null;
}
