import { deriveSeen } from "./derive";
import { shortestUnseenPaths } from "./engine";
import type { Content } from "./schema";

/** The layout must be in bounds, with the start and exit unseen and exactly one shortest unseen path between them. */
export function verifyCctvMaze(content: Content) {
  const { rows, cols, walls, cameras, startRow, startCol, exitRow, exitCol } =
    content;
  const inBounds = (row: number, col: number) =>
    row >= 0 && row < rows && col >= 0 && col < cols;
  if (!inBounds(startRow, startCol)) {
    throw new Error(`start (${startRow}, ${startCol}) is out of bounds`);
  }
  if (!inBounds(exitRow, exitCol)) {
    throw new Error(`exit (${exitRow}, ${exitCol}) is out of bounds`);
  }
  if (startRow === exitRow && startCol === exitCol) {
    throw new Error("the start and the exit are the same cell");
  }
  for (const [i, { row, col, side }] of walls.entries()) {
    if (!inBounds(row, col)) {
      throw new Error(`${side} wall of (${row}, ${col}) is out of bounds`);
    }
    if ((side === "north" ? row : col) === 0) {
      throw new Error(
        `${side} wall of (${row}, ${col}) is on the boundary, which is already a wall`,
      );
    }
    if (walls.findIndex((w) => w.row === row && w.col === col && w.side === side) !== i) {
      throw new Error(`${side} wall of (${row}, ${col}) is listed twice`);
    }
  }
  for (const [i, { row, col }] of cameras.entries()) {
    if (!inBounds(row, col)) {
      throw new Error(`camera at (${row}, ${col}) is out of bounds`);
    }
    if (cameras.findIndex((c) => c.row === row && c.col === col) !== i) {
      throw new Error(`two cameras stand at (${row}, ${col})`);
    }
  }
  const seen = deriveSeen(content);
  const isSeen = (row: number, col: number) =>
    seen.some((c) => c.row === row && c.col === col);
  if (isSeen(startRow, startCol)) {
    throw new Error(`the start (${startRow}, ${startCol}) is seen by a camera`);
  }
  if (isSeen(exitRow, exitCol)) {
    throw new Error(`the exit (${exitRow}, ${exitCol}) is seen by a camera`);
  }
  const { count, length } = shortestUnseenPaths(content, seen);
  if (count === 0) throw new Error("no unseen path leads from the start to the exit");
  if (count > 1) {
    throw new Error(
      `more than one shortest unseen path leads to the exit (${length} steps)`,
    );
  }
}
