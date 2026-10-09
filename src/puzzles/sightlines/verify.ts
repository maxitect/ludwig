import { deriveBlindSpots } from "./derive";
import type { Content } from "./schema";

/** The layout must be a full grid, sit in bounds, and leave blind spots that include the alcove. */
export function verifySightlines({
  grid,
  targetRow,
  targetCol,
  observers,
}: Content) {
  const rows = grid.length;
  const cols = grid[0].length;
  const ragged = grid.findIndex((line) => line.length !== cols);
  if (ragged !== -1) {
    throw new Error(
      `grid is not full: row ${ragged + 1} has ${grid[ragged].length} cells, row 1 has ${cols}`,
    );
  }
  const inBounds = (row: number, col: number) =>
    row >= 0 && row < rows && col >= 0 && col < cols;
  if (!inBounds(targetRow, targetCol)) {
    throw new Error(`target (${targetRow}, ${targetCol}) is out of bounds`);
  }
  const isPillar = (row: number, col: number) => grid[row][col] === "#";
  if (isPillar(targetRow, targetCol)) {
    throw new Error(`target (${targetRow}, ${targetCol}) is on a pillar`);
  }
  if (!observers.length) throw new Error("there are no observers");
  for (const [i, { row, col }] of observers.entries()) {
    if (!inBounds(row, col)) {
      throw new Error(`observer at (${row}, ${col}) is out of bounds`);
    }
    if (isPillar(row, col)) {
      throw new Error(`observer at (${row}, ${col}) stands on a pillar`);
    }
    if (observers.findIndex((o) => o.row === row && o.col === col) !== i) {
      throw new Error(`two observers stand at (${row}, ${col})`);
    }
  }
  const obstacles = grid.flatMap((line, row) =>
    [...line].flatMap((ch, col) => (ch === "#" ? [{ row, col }] : [])),
  );
  const blind = deriveBlindSpots({ rows, cols, obstacles, observers });
  if (!blind.length) throw new Error("no cell is a blind spot");
  if (!blind.some((c) => c.row === targetRow && c.col === targetCol)) {
    throw new Error(
      `the target (${targetRow}, ${targetCol}) is seen by an observer, so it is not a blind spot`,
    );
  }
}
