import type { Given, Solution } from "./schema";

const SIZE = 9;
const CELLS = SIZE * SIZE;
const ALL_DIGITS = 0b1111111110;

const boxOf = (index: number) =>
  Math.floor(index / 27) * 3 + Math.floor((index % SIZE) / 3);

const bitCount = (mask: number) => {
  let count = 0;
  for (let rest = mask; rest; rest &= rest - 1) count++;
  return count;
};

/** Row-major grid of 81 digits, 0 for an empty cell. */
export type Grid = number[];

export function gridFromGivens(givens: ReadonlyArray<Given>): Grid {
  const grid: Grid = Array(CELLS).fill(0);
  for (const { row, col, digit } of givens) grid[row * SIZE + col] = digit;
  return grid;
}

export function toSolution(grid: Grid): Solution {
  return grid.map((digit, index) => ({
    row: Math.floor(index / SIZE),
    col: index % SIZE,
    digit,
  }));
}

/** Indexes of filled cells that share a digit with another cell of their row, column or box. */
export function conflictingIndexes(grid: Grid) {
  const conflicts = new Set<number>();
  const units = [
    (index: number) => Math.floor(index / SIZE),
    (index: number) => index % SIZE,
    boxOf,
  ];
  for (const unitOf of units) {
    const seen = new Map<string, number>();
    grid.forEach((digit, index) => {
      if (!digit) return;
      const key = `${unitOf(index)}:${digit}`;
      const other = seen.get(key);
      if (other === undefined) {
        seen.set(key, index);
      } else {
        conflicts.add(other);
        conflicts.add(index);
      }
    });
  }
  return conflicts;
}

/**
 * Finds up to `limit` completions of the grid by backtracking on the empty cell with the fewest
 * candidates. Contradictory givens yield none.
 */
export function enumerateSolutions(start: Grid, limit: number) {
  const grid = [...start];
  if (conflictingIndexes(grid).size) return [];
  const rows = Array<number>(SIZE).fill(0);
  const cols = Array<number>(SIZE).fill(0);
  const boxes = Array<number>(SIZE).fill(0);
  grid.forEach((digit, index) => {
    if (!digit) return;
    const bit = 1 << digit;
    rows[Math.floor(index / SIZE)] |= bit;
    cols[index % SIZE] |= bit;
    boxes[boxOf(index)] |= bit;
  });

  const found: Grid[] = [];
  const candidates = (index: number) =>
    ALL_DIGITS &
    ~(rows[Math.floor(index / SIZE)] | cols[index % SIZE] | boxes[boxOf(index)]);

  function search() {
    let best = -1;
    let bestMask = 0;
    let bestCount = SIZE + 1;
    for (let index = 0; index < CELLS; index++) {
      if (grid[index]) continue;
      const mask = candidates(index);
      const count = bitCount(mask);
      if (count < bestCount) {
        best = index;
        bestMask = mask;
        bestCount = count;
        if (count <= 1) break;
      }
    }
    if (best === -1) {
      found.push([...grid]);
      return;
    }
    const row = Math.floor(best / SIZE);
    const col = best % SIZE;
    const box = boxOf(best);
    for (let digit = 1; digit <= SIZE && found.length < limit; digit++) {
      const bit = 1 << digit;
      if (!(bestMask & bit)) continue;
      grid[best] = digit;
      rows[row] |= bit;
      cols[col] |= bit;
      boxes[box] |= bit;
      search();
      grid[best] = 0;
      rows[row] &= ~bit;
      cols[col] &= ~bit;
      boxes[box] &= ~bit;
    }
  }

  search();
  return found;
}

/** Number of completions, counted only up to `limit`. */
export function countSolutions(
  givens: ReadonlyArray<Given>,
  limit = 2,
): number {
  return enumerateSolutions(gridFromGivens(givens), limit).length;
}

/** The first completion of the givens, or null when there is none. */
export function solve(givens: ReadonlyArray<Given>): Solution | null {
  const [first] = enumerateSolutions(gridFromGivens(givens), 1);
  return first ? toSolution(first) : null;
}
