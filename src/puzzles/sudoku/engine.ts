import type { Cage, Given, Regions, Solution, Xv } from "./schema";

const SIZE = 9;
const CELLS = SIZE * SIZE;
const ALL_DIGITS = 0b1111111110;

/** Cell indexes of each nine-cell unit in which every digit appears once. */
export type Units = ReadonlyArray<ReadonlyArray<number>>;

export const rowUnits: Units = Array.from({ length: SIZE }, (_, row) =>
  Array.from({ length: SIZE }, (_, col) => row * SIZE + col),
);
export const colUnits: Units = Array.from({ length: SIZE }, (_, col) =>
  Array.from({ length: SIZE }, (_, row) => row * SIZE + col),
);
export const boxUnits: Units = Array.from({ length: SIZE }, (_, box) =>
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

/** Classic sudoku uses rows, columns and boxes; jigsaw swaps the boxes for its regions; rainbow adds its colour groups. Rows and columns always come first. */
export function unitsFor(regions?: Regions | null): Units {
  if (!regions) return classicUnits;
  if (regions.kind === "jigsaw") {
    return [...rowUnits, ...colUnits, ...regionUnits(regions)];
  }
  return [...classicUnits, ...regionUnits(regions)];
}

/** A cage as the indexes of its cells and the sum they make. */
type CageRule = { cells: ReadonlyArray<number>; sum: number };

/** An adjacent pair of cells: `sum` is 10 for an X, 5 for a V, and null when unmarked (the negative rule). */
type PairRule = { a: number; b: number; sum: 5 | 10 | null };

/** The killer cages and the XV pairs of a puzzle, on top of its units. */
export type Variant = {
  cages: ReadonlyArray<CageRule>;
  xv: ReadonlyArray<PairRule> | null;
};

const XV_SUMS = { x: 10, v: 5 } as const;

/** The constraints a puzzle's cages and XV set add, or undefined for a puzzle with neither. The negative rule only applies when there is an XV set. */
export function variantFor({
  cages,
  xv,
}: {
  cages?: ReadonlyArray<Cage> | null;
  xv?: Xv | null;
}): Variant | undefined {
  if (!cages?.length && !xv) return undefined;
  const marked = new Map(
    xv?.marks.map(({ row, col, direction, mark }) => [
      `${row},${col},${direction}`,
      XV_SUMS[mark],
    ]),
  );
  const pairs: PairRule[] = [];
  if (xv) {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const index = row * SIZE + col;
        if (col < SIZE - 1) {
          pairs.push({
            a: index,
            b: index + 1,
            sum: marked.get(`${row},${col},right`) ?? null,
          });
        }
        if (row < SIZE - 1) {
          pairs.push({
            a: index,
            b: index + SIZE,
            sum: marked.get(`${row},${col},down`) ?? null,
          });
        }
      }
    }
  }
  return {
    cages: (cages ?? []).map(({ sum, cells }) => ({
      sum,
      cells: cells.map(({ row, col }) => row * SIZE + col),
    })),
    xv: xv ? pairs : null,
  };
}

const pairBroken = (sum: PairRule["sum"], a: number, b: number) =>
  sum === null ? a + b === 5 || a + b === 10 : a + b !== sum;

/** Smallest and largest sum of `count` distinct digits drawn from those not in `used`, indexed by `used * 10 + count`. */
const reach = (() => {
  const low = new Int16Array(1024 * 10).fill(-1);
  const high = new Int16Array(1024 * 10).fill(-1);
  for (let used = 0; used < 1024; used += 2) {
    const free: number[] = [];
    for (let digit = 1; digit <= SIZE; digit++) {
      if (!(used & (1 << digit))) free.push(digit);
    }
    let min = 0;
    let max = 0;
    for (let count = 0; count <= free.length; count++) {
      low[used * 10 + count] = min;
      high[used * 10 + count] = max;
      min += free[count] ?? 0;
      max += free[free.length - 1 - count] ?? 0;
    }
  }
  return { low, high };
})();

/** Whether `count` more distinct digits outside `used` can still make `sum`. */
const reachable = (used: number, count: number, sum: number) => {
  const slot = used * 10 + count;
  return (
    reach.low[slot] !== -1 && sum >= reach.low[slot] && sum <= reach.high[slot]
  );
};

/** The digits that appear in some set of `count` distinct digits adding up to `sum`. */
function cageDigits(count: number, sum: number) {
  let digits = 0;
  const walk = (from: number, left: number, rest: number, picked: number) => {
    if (left === 0) {
      if (rest === 0) digits |= picked;
      return;
    }
    for (let digit = from; digit <= SIZE; digit++) {
      walk(digit + 1, left - 1, rest - digit, picked | (1 << digit));
    }
  };
  walk(1, count, sum, 0);
  return digits;
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

/**
 * Indexes of filled cells that share a digit with another cell of one of the units, that repeat a
 * digit in a cage or sit in one that is over its sum or full and off it, or that break an XV pair.
 */
export function conflictingIndexes(
  grid: Grid,
  units: Units = classicUnits,
  variant?: Variant,
) {
  const conflicts = new Set<number>();
  for (const { cells, sum } of variant?.cages ?? []) {
    const seen = new Set<number>();
    let total = 0;
    let filled = 0;
    let repeats = false;
    for (const index of cells) {
      const digit = grid[index];
      if (!digit) continue;
      filled++;
      total += digit;
      repeats ||= seen.has(digit);
      seen.add(digit);
    }
    if (repeats || total > sum || (filled === cells.length && total !== sum)) {
      for (const index of cells) if (grid[index]) conflicts.add(index);
    }
  }
  for (const { a, b, sum } of variant?.xv ?? []) {
    if (grid[a] && grid[b] && pairBroken(sum, grid[a], grid[b])) {
      conflicts.add(a);
      conflicts.add(b);
    }
  }
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
  variant?: Variant,
) {
  const grid = [...start];
  if (conflictingIndexes(grid, units, variant).size) return [];
  const unitsOf: number[][] = Array.from({ length: CELLS }, () => []);
  units.forEach((unit, id) => {
    for (const index of unit) unitsOf[index].push(id);
  });
  const used = Array<number>(units.length).fill(0);
  grid.forEach((digit, index) => {
    if (!digit) return;
    for (const id of unitsOf[index]) used[id] |= 1 << digit;
  });

  const cages = variant?.cages ?? [];
  const cageOf = Array<number>(CELLS).fill(-1);
  cages.forEach(({ cells }, id) => {
    for (const index of cells) cageOf[index] = id;
  });
  const cageUsed = Array<number>(cages.length).fill(0);
  const cageLeft = cages.map(({ cells }) => cells.length);
  const cageSum = cages.map(({ sum }) => sum);
  const cageAllowed = cages.map(({ cells, sum }) =>
    cageDigits(cells.length, sum),
  );
  cages.forEach(({ cells }, id) => {
    for (const index of cells) {
      if (!grid[index]) continue;
      cageUsed[id] |= 1 << grid[index];
      cageSum[id] -= grid[index];
      cageLeft[id]--;
    }
  });
  const pairsOf: PairRule[][] = Array.from({ length: CELLS }, () => []);
  for (const pair of variant?.xv ?? []) {
    pairsOf[pair.a].push(pair);
    pairsOf[pair.b].push(pair);
  }

  const found: Grid[] = [];
  const candidates = (index: number) => {
    let taken = 0;
    for (const id of unitsOf[index]) taken |= used[id];
    let mask = ALL_DIGITS & ~taken;
    const cage = cageOf[index];
    if (cage !== -1) {
      mask &= cageAllowed[cage] & ~cageUsed[cage];
      for (let rest = mask; rest; rest &= rest - 1) {
        const bit = rest & -rest;
        const digit = 31 - Math.clz32(bit);
        const open = reachable(
          cageUsed[cage] | bit,
          cageLeft[cage] - 1,
          cageSum[cage] - digit,
        );
        if (!open) mask &= ~bit;
      }
    }
    for (const { a, b, sum } of pairsOf[index]) {
      const other = grid[a === index ? b : a];
      if (!other) continue;
      if (sum === null) {
        mask &= ~(1 << (5 - other)) & ~(1 << (10 - other));
      } else {
        const want = sum - other;
        mask &= want >= 1 && want <= SIZE ? 1 << want : 0;
      }
    }
    return mask;
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
      const cage = cageOf[best];
      grid[best] = digit;
      for (const id of unitsOf[best]) used[id] |= bit;
      if (cage !== -1) {
        cageUsed[cage] |= bit;
        cageSum[cage] -= digit;
        cageLeft[cage]--;
      }
      search();
      grid[best] = 0;
      for (const id of unitsOf[best]) used[id] &= ~bit;
      if (cage !== -1) {
        cageUsed[cage] &= ~bit;
        cageSum[cage] += digit;
        cageLeft[cage]++;
      }
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
  variant?: Variant,
): number {
  return enumerateSolutions(gridFromGivens(givens), limit, units, variant)
    .length;
}

/** The first completion of the givens, or null when there is none. */
export function solve(
  givens: ReadonlyArray<Given>,
  units: Units = classicUnits,
  variant?: Variant,
): Solution | null {
  const [first] = enumerateSolutions(
    gridFromGivens(givens),
    1,
    units,
    variant,
  );
  return first ? toSolution(first) : null;
}
