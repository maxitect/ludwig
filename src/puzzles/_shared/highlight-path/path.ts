import type { CellPosition } from "../cell-grid/navigation";

export type { CellPosition };

/** The eight compass steps, clockwise from east. */
export const COMPASS: readonly CellPosition[] = [
  { row: 0, col: 1 },
  { row: 1, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: -1 },
  { row: 0, col: -1 },
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
];

/**
 * The cells a selection from `start` towards `end` covers. A selection that is not on a row,
 * column or diagonal snaps to the nearest of the eight compass directions, and the path stops at
 * the grid edge.
 */
export function selectionPath(
  start: CellPosition,
  end: CellPosition,
  { rows, cols }: { rows: number; cols: number },
): CellPosition[] {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;
  if (dRow === 0 && dCol === 0) return [start];
  const octant = Math.round(Math.atan2(dRow, dCol) / (Math.PI / 4));
  const step = COMPASS[((octant % 8) + 8) % 8];
  const length = Math.max(Math.abs(dRow), Math.abs(dCol)) + 1;
  const path: CellPosition[] = [];
  for (let i = 0; i < length; i++) {
    const row = start.row + step.row * i;
    const col = start.col + step.col * i;
    if (row < 0 || row >= rows || col < 0 || col >= cols) break;
    path.push({ row, col });
  }
  return path;
}
