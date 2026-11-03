import type { Given, Solution } from "./schema";

/** Row-major grid of `rows * cols` cells: 0 is empty, 1 to 9 are digits. */
export type Grid = number[];

type Layout = { rows: number; cols: number };
type Puzzle = Layout & { givens: ReadonlyArray<Given> };

export type Area = { digit: number; cells: number[] };

export function gridFromGivens(
  { rows, cols }: Layout,
  givens: ReadonlyArray<Given>,
): Grid {
  const grid: Grid = Array(rows * cols).fill(0);
  for (const { row, col, digit } of givens) grid[row * cols + col] = digit;
  return grid;
}

export function toSolution({ cols }: Layout, grid: Grid): Solution {
  return grid.map((digit, index) => ({
    row: Math.floor(index / cols),
    col: index % cols,
    digit,
  }));
}

function neighbours({ rows, cols }: Layout, index: number) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const found: number[] = [];
  if (row > 0) found.push(index - cols);
  if (row < rows - 1) found.push(index + cols);
  if (col > 0) found.push(index - 1);
  if (col < cols - 1) found.push(index + 1);
  return found;
}

/** The edge-connected groups of equal digits, found by flood fill. Empty cells belong to no area. */
export function areas(layout: Layout, grid: Grid): Area[] {
  const seen = new Set<number>();
  const found: Area[] = [];
  grid.forEach((digit, start) => {
    if (!digit || seen.has(start)) return;
    const cells = [start];
    seen.add(start);
    for (let at = 0; at < cells.length; at++) {
      for (const next of neighbours(layout, cells[at])) {
        if (grid[next] === digit && !seen.has(next)) {
          seen.add(next);
          cells.push(next);
        }
      }
    }
    found.push({ digit, cells });
  });
  return found;
}

/**
 * Indexes of cells in an area that is too big (which includes two areas of one size touching, since
 * they merge) or that is too small and walled in by other digits so it cannot grow.
 */
export function brokenIndexes(layout: Layout, grid: Grid) {
  const broken = new Set<number>();
  for (const { digit, cells } of areas(layout, grid)) {
    const open = cells.some((cell) =>
      neighbours(layout, cell).some((next) => grid[next] === 0),
    );
    if (cells.length > digit || (cells.length < digit && !open)) {
      for (const cell of cells) broken.add(cell);
    }
  }
  return broken;
}

/**
 * Finds up to `limit` completions by backtracking, branching on whichever is tighter: the empty cell
 * with the fewest candidate digits, or the unfinished area with the fewest cells it could grow into
 * (an area must take one of them, so no solution is missed; repeats are dropped). A digit is a
 * candidate when the area it would join stays no bigger than the digit and can still reach it
 * through empty cells. Contradictory givens yield none.
 */
export function enumerateSolutions(puzzle: Puzzle, limit: number) {
  const layout = { rows: puzzle.rows, cols: puzzle.cols };
  const grid = gridFromGivens(layout, puzzle.givens);
  if (brokenIndexes(layout, grid).size) return [];

  /** Size of the area at `start` and how far it could grow through empty cells, stopping at `want`. */
  function reach(start: number, want: number) {
    const digit = grid[start];
    const seen = new Set([start]);
    let room = 1;
    const frontier = [start];
    while (frontier.length) {
      const cell = frontier.pop()!;
      for (const next of neighbours(layout, cell)) {
        if (seen.has(next)) continue;
        if (grid[next] === digit || grid[next] === 0) {
          seen.add(next);
          room++;
          frontier.push(next);
        }
      }
      if (room >= want) break;
    }
    const sized = new Set([start]);
    const queue = [start];
    for (let at = 0; at < queue.length; at++) {
      for (const next of neighbours(layout, queue[at])) {
        if (grid[next] === digit && !sized.has(next)) {
          sized.add(next);
          queue.push(next);
        }
      }
    }
    return { size: sized.size, room };
  }

  const viable = (index: number) => {
    const { size, room } = reach(index, grid[index]);
    return size <= grid[index] && room >= grid[index];
  };

  function place(index: number, digit: number) {
    grid[index] = digit;
    if (!viable(index)) return false;
    return neighbours(layout, index).every(
      (next) => !grid[next] || grid[next] === digit || viable(next),
    );
  }

  const candidates = (index: number) => {
    const codes: number[] = [];
    for (let digit = 1; digit <= 9; digit++) {
      const fits = place(index, digit);
      grid[index] = 0;
      if (fits) codes.push(digit);
    }
    return codes;
  };

  const found: Grid[] = [];
  const seenKeys = new Set<string>();

  /** The unfinished area with the fewest cells it could grow into, and those cells. */
  function tightestArea() {
    let best: { digit: number; exits: number[] } | null = null;
    for (const { digit, cells } of areas(layout, grid)) {
      if (cells.length >= digit) continue;
      const exits = new Set<number>();
      for (const cell of cells) {
        for (const next of neighbours(layout, cell)) {
          if (grid[next] === 0) exits.add(next);
        }
      }
      const open = [...exits].filter((exit) => {
        const fits = place(exit, digit);
        grid[exit] = 0;
        return fits;
      });
      if (!best || open.length < best.exits.length) {
        best = { digit, exits: open };
        if (!open.length) break;
      }
    }
    return best;
  }

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
      const key = grid.join("");
      if (!brokenIndexes(layout, grid).size && !seenKeys.has(key)) {
        seenKeys.add(key);
        found.push([...grid]);
      }
      return;
    }
    const area = bestCodes.length > 1 ? tightestArea() : null;
    if (area && area.exits.length < bestCodes.length) {
      for (const exit of area.exits) {
        if (found.length >= limit) return;
        grid[exit] = area.digit;
        search();
        grid[exit] = 0;
      }
      return;
    }
    for (const digit of bestCodes) {
      if (found.length >= limit) return;
      grid[best] = digit;
      search();
      grid[best] = 0;
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
  return first ? toSolution(puzzle, first) : null;
}
