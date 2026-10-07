import type { Inequality, Payload, Solution } from "./schema";

/** Row-major grid of `size * size` digits, 0 for an empty cell. */
export type Grid = number[];

type Puzzle = Pick<Payload, "size" | "givens" | "inequalities">;

/** Index pairs `[smaller, larger]`, one per sign, whichever way the sign points. */
export function orderedPairs(
  size: number,
  inequalities: ReadonlyArray<Inequality>,
) {
  return inequalities.map(({ row, col, direction, relation }) => {
    const from = row * size + col;
    const to = direction === "right" ? from + 1 : from + size;
    return relation === "lt" ? [from, to] : [to, from];
  });
}

export function gridFromGivens(
  size: number,
  givens: ReadonlyArray<Puzzle["givens"][number]>,
): Grid {
  const grid: Grid = Array(size * size).fill(0);
  for (const { row, col, digit } of givens) grid[row * size + col] = digit;
  return grid;
}

export function toSolution(size: number, grid: Grid): Solution {
  return grid.map((digit, index) => ({
    row: Math.floor(index / size),
    col: index % size,
    digit,
  }));
}

/** Indexes of filled cells that repeat a digit in their row or column, or break a sign with a filled neighbour. */
export function conflictingIndexes(
  size: number,
  inequalities: ReadonlyArray<Inequality>,
  grid: Grid,
) {
  const conflicts = new Set<number>();
  const units = [
    (index: number) => Math.floor(index / size),
    (index: number) => size + (index % size),
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
  for (const [smaller, larger] of orderedPairs(size, inequalities)) {
    if (grid[smaller] && grid[larger] && grid[smaller] >= grid[larger]) {
      conflicts.add(smaller);
      conflicts.add(larger);
    }
  }
  return conflicts;
}

/**
 * Finds up to `limit` completions by backtracking on the empty cell with the fewest candidates.
 * Contradictory givens yield none.
 */
export function enumerateSolutions(puzzle: Puzzle, limit: number) {
  const { size, givens, inequalities } = puzzle;
  const grid = gridFromGivens(size, givens);
  if (conflictingIndexes(size, inequalities, grid).size) return [];
  const cells = size * size;
  const rows = Array<number>(size).fill(0);
  const cols = Array<number>(size).fill(0);
  grid.forEach((digit, index) => {
    if (!digit) return;
    rows[Math.floor(index / size)] |= 1 << digit;
    cols[index % size] |= 1 << digit;
  });
  const greater: number[][] = Array.from({ length: cells }, () => []);
  const lesser: number[][] = Array.from({ length: cells }, () => []);
  for (const [smaller, larger] of orderedPairs(size, inequalities)) {
    greater[smaller].push(larger);
    lesser[larger].push(smaller);
  }

  const fits = (index: number, digit: number) =>
    greater[index].every((other) => (grid[other] || size) > digit) &&
    lesser[index].every((other) => (grid[other] || 1) < digit);

  const candidates = (index: number) => {
    const taken = rows[Math.floor(index / size)] | cols[index % size];
    const digits: number[] = [];
    for (let digit = 1; digit <= size; digit++) {
      if (!(taken & (1 << digit)) && fits(index, digit)) digits.push(digit);
    }
    return digits;
  };

  const found: Grid[] = [];
  function search() {
    let best = -1;
    let bestDigits: number[] = [];
    for (let index = 0; index < cells; index++) {
      if (grid[index]) continue;
      const digits = candidates(index);
      if (best === -1 || digits.length < bestDigits.length) {
        best = index;
        bestDigits = digits;
        if (digits.length <= 1) break;
      }
    }
    if (best === -1) {
      found.push([...grid]);
      return;
    }
    const row = Math.floor(best / size);
    const col = best % size;
    for (const digit of bestDigits) {
      if (found.length >= limit) return;
      grid[best] = digit;
      rows[row] |= 1 << digit;
      cols[col] |= 1 << digit;
      search();
      grid[best] = 0;
      rows[row] &= ~(1 << digit);
      cols[col] &= ~(1 << digit);
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
