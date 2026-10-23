import { cellKey } from "../_shared/cell-grid/navigation";
import { clueRun, runCells } from "./derive";
import type { Payload } from "./schema";

const FULL = 0b1111111110;

const popcount = (mask: number) => {
  let count = 0;
  for (let m = mask; m; m &= m - 1) count++;
  return count;
};

/** Digit sets as bitmasks (bit d is digit d), indexed by length then sum. */
const COMBINATIONS: number[][][] = (() => {
  const table: number[][][] = Array.from({ length: 10 }, () =>
    Array.from({ length: 46 }, () => []),
  );
  for (let mask = 2; mask <= FULL; mask += 2) {
    let sum = 0;
    for (let digit = 1; digit <= 9; digit++) if (mask & (1 << digit)) sum += digit;
    table[popcount(mask)][sum].push(mask);
  }
  return table;
})();

/** Every set of `length` distinct digits 1 to 9 adding up to `sum`, each in ascending order. */
export function combinations(length: number, sum: number): number[][] {
  return (COMBINATIONS[length]?.[sum] ?? [])
    .map((mask) =>
      Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => mask & (1 << d)),
    )
    .sort((a, b) => a.join("").localeCompare(b.join("")));
}

type Run = { cells: number[]; sum: number; length: number };

/**
 * Counts the fillings of the white cells in which every run holds distinct digits adding up to its
 * clue, stopping at `limit`. Each step picks the cell with fewest candidates, where a run only allows
 * the digits of a combination for its sum that still contains the digits it already uses.
 */
export function countSolutions(
  { cells, clues }: Pick<Payload, "cells" | "clues">,
  limit = 2,
): number {
  const index = new Map(cells.map(({ row, col }, i) => [cellKey(row, col), i]));
  const runs: Run[] = clues.map((clue) => ({
    cells: runCells(clueRun(clue)).map(
      ({ row, col }) => index.get(cellKey(row, col)) ?? -1,
    ),
    sum: clue.sum,
    length: clue.length,
  }));
  if (runs.some((run) => run.cells.includes(-1))) return 0;
  const runsOf: Run[][] = cells.map(() => []);
  for (const run of runs) for (const cell of run.cells) runsOf[cell].push(run);
  if (runsOf.some((own) => own.length === 0)) return 0;

  const used = new Map<Run, number>(runs.map((run) => [run, 0]));
  const allowedCache = new Map<number, number>();
  const allowed = (run: Run) => {
    const key = (run.length * 46 + run.sum) * 1024 + used.get(run)!;
    let mask = allowedCache.get(key);
    if (mask === undefined) {
      mask = 0;
      for (const combo of COMBINATIONS[run.length]?.[run.sum] ?? []) {
        if ((combo & used.get(run)!) === used.get(run)) mask |= combo;
      }
      mask &= ~used.get(run)!;
      allowedCache.set(key, mask);
    }
    return mask;
  };

  const digits = new Array<number>(cells.length).fill(0);
  let found = 0;
  const search = (filled: number) => {
    if (filled === cells.length) {
      found++;
      return;
    }
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let cell = 0; cell < cells.length; cell++) {
      if (digits[cell]) continue;
      const mask = runsOf[cell].reduce((m, run) => m & allowed(run), FULL);
      const count = popcount(mask);
      if (count < bestCount) {
        best = cell;
        bestMask = mask;
        bestCount = count;
        if (count <= 1) break;
      }
    }
    if (bestCount === 0) return;
    for (let digit = 1; digit <= 9 && found < limit; digit++) {
      if (!(bestMask & (1 << digit))) continue;
      digits[best] = digit;
      for (const run of runsOf[best]) used.set(run, used.get(run)! | (1 << digit));
      search(filled + 1);
      for (const run of runsOf[best]) used.set(run, used.get(run)! & ~(1 << digit));
      digits[best] = 0;
    }
  };
  search(0);
  return found;
}
