import type { Given, Regions, Solution } from "./schema";

const SIZE = 9;
const CELLS = SIZE * SIZE;
const ALL_DIGITS = 0b1111111110;

/** Cell indexes of each nine-cell unit in which every digit appears once. */
export type Units = ReadonlyArray<ReadonlyArray<number>>;

const rowUnits: Units = Array.from({ length: SIZE }, (_, row) =>
  Array.from({ length: SIZE }, (_, col) => row * SIZE + col),
);
const colUnits: Units = Array.from({ length: SIZE }, (_, col) =>
  Array.from({ length: SIZE }, (_, row) => row * SIZE + col),
);
const boxUnits: Units = Array.from({ length: SIZE }, (_, box) =>
  Array.from(
    { length: SIZE },
    (_, k) =>
      (Math.floor(box / 3) * 3 + Math.floor(k / 3)) * SIZE +
      (box % 3) * 3 +
      (k % 3),
  ),
);

export const classicUnits: Units = [...rowUnits, ...colUnits, ...boxUnits];

const regionUnits = ({ cells }: Regions): Units => {
  const units: number[][] = Array.from({ length: SIZE }, () => []);
  for (const { row, col, region } of cells)
    units[region].push(row * SIZE + col);
  return units;
};

/** Classic sudoku uses rows, columns and boxes; jigsaw swaps the boxes for its regions; rainbow adds its colour groups. */
export function unitsFor(regions?: Regions | null): Units {
  if (!regions) return classicUnits;
  if (regions.kind === "jigsaw") {
    return [...rowUnits, ...colUnits, ...regionUnits(regions)];
  }
  return [...classicUnits, ...regionUnits(regions)];
}

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

/** Indexes of filled cells that share a digit with another cell of one of the units. */
export function conflictingIndexes(grid: Grid, units: Units = classicUnits) {
  const conflicts = new Set<number>();
  for (const unit of units) {
    const seen = new Map<number, number>();
    for (const index of unit) {
      const digit = grid[index];
      if (!digit) continue;
      const other = seen.get(digit);
      if (other === undefined) {
        seen.set(digit, index);
      } else {
        conflicts.add(other);
        conflicts.add(index);
      }
    }
  }
  return conflicts;
}

/**
 * Finds up to `limit` completions of the grid by backtracking on the empty cell with the fewest
 * candidates. Contradictory givens yield none.
 */
export function enumerateSolutions(
  start: Grid,
  limit: number,
  units: Units = classicUnits,
) {
  const grid = [...start];
  if (conflictingIndexes(grid, units).size) return [];
  const unitsOf: number[][] = Array.from({ length: CELLS }, () => []);
  units.forEach((unit, id) => {
    for (const index of unit) unitsOf[index].push(id);
  });
  const used = Array<number>(units.length).fill(0);
  grid.forEach((digit, index) => {
    if (!digit) return;
    for (const id of unitsOf[index]) used[id] |= 1 << digit;
  });

  const found: Grid[] = [];
  const candidates = (index: number) => {
    let taken = 0;
    for (const id of unitsOf[index]) taken |= used[id];
    return ALL_DIGITS & ~taken;
  };

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
    for (let digit = 1; digit <= SIZE && found.length < limit; digit++) {
      const bit = 1 << digit;
      if (!(bestMask & bit)) continue;
      grid[best] = digit;
      for (const id of unitsOf[best]) used[id] |= bit;
      search();
      grid[best] = 0;
      for (const id of unitsOf[best]) used[id] &= ~bit;
    }
  }

  search();
  return found;
}

/** Number of completions, counted only up to `limit`. */
export function countSolutions(
  givens: ReadonlyArray<Given>,
  limit = 2,
  units: Units = classicUnits,
): number {
  return enumerateSolutions(gridFromGivens(givens), limit, units).length;
}

/** The first completion of the givens, or null when there is none. */
export function solve(
  givens: ReadonlyArray<Given>,
  units: Units = classicUnits,
): Solution | null {
  const [first] = enumerateSolutions(gridFromGivens(givens), 1, units);
  return first ? toSolution(first) : null;
}
