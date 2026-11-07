import { cellKey } from "../_shared/cell-grid/navigation";
import { deriveAnswer, deriveRuns, runCells } from "./derive";
import type { Content } from "./schema";

/** The grid standards `verifyCrossword` enforces. Ratios are fractions of white cells (checked) or of all cells (black). */
export const GRID_STANDARDS = {
  minEntryLength: 3,
  blocked: {
    checkedRatio: { min: 0.3, max: 0.6 },
    maxBlackRatio: 0.4,
  },
  mini: {
    minCheckedRatio: 0.6,
    maxEntries: 32,
  },
} as const;

/** Entries and the share of white cells that sit in both an across and a down entry. */
export function measureGrid({
  rows,
  cols,
  cells,
}: Pick<Content, "rows" | "cols" | "cells">) {
  const runs = deriveRuns(cells);
  const counts = new Map<string, number>();
  for (const run of runs) {
    for (const { row, col } of runCells(run)) {
      const key = cellKey(row, col);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const checked = [...counts.values()].filter((n) => n > 1).length;
  return {
    entries: runs.length,
    checkedRatio: checked / cells.length,
    blackRatio: 1 - cells.length / (rows * cols),
    counts,
    runs,
  };
}

/** Every entry word of a grid, in run order. */
export function gridWords(cells: Content["cells"]) {
  return deriveRuns(cells).map((run) => deriveAnswer(cells, run));
}

/** Two words share a root when they start with the same four letters, or one is the other's stem with a plural S dropped. */
export function sharesRoot(a: string, b: string) {
  if (a.length < 4 || b.length < 4) return false;
  if (a.slice(0, 4) === b.slice(0, 4)) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const stem = short.replace(/S$/, "");
  return stem.length >= 3 && long.startsWith(stem);
}
