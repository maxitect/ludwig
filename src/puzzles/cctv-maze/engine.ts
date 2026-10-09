import { canStep } from "./derive";
import type { Content } from "./schema";

type Cell = { row: number; col: number };
type Maze = Pick<
  Content,
  "rows" | "cols" | "walls" | "startRow" | "startCol" | "exitRow" | "exitCol"
>;

const key = (row: number, col: number) => `${row},${col}`;
const STEPS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

/**
 * Breadth-first search over unseen cells. `count` is the number of shortest paths from start to
 * exit, capped at 2 (0: none, 1: unique, 2: two or more). `path` is one shortest path, start first.
 */
export function shortestUnseenPaths(maze: Maze, seen: readonly Cell[]) {
  const unseen = (row: number, col: number) =>
    row >= 0 &&
    row < maze.rows &&
    col >= 0 &&
    col < maze.cols &&
    !seen.some((c) => c.row === row && c.col === col);
  const start: Cell = { row: maze.startRow, col: maze.startCol };
  const exit: Cell = { row: maze.exitRow, col: maze.exitCol };
  if (!unseen(start.row, start.col) || !unseen(exit.row, exit.col)) {
    return { count: 0 as 0 | 1 | 2, length: null, path: null };
  }
  const dist = new Map([[key(start.row, start.col), 0]]);
  const count = new Map([[key(start.row, start.col), 1]]);
  const parent = new Map<string, Cell>();
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const from = queue[head];
    const fromKey = key(from.row, from.col);
    for (const [dRow, dCol] of STEPS) {
      const to = { row: from.row + dRow, col: from.col + dCol };
      if (!unseen(to.row, to.col) || !canStep(maze, from, to)) continue;
      const toKey = key(to.row, to.col);
      const next = dist.get(fromKey)! + 1;
      const known = dist.get(toKey);
      if (known === undefined) {
        dist.set(toKey, next);
        count.set(toKey, count.get(fromKey)!);
        parent.set(toKey, from);
        queue.push(to);
      } else if (known === next) {
        count.set(toKey, Math.min(2, count.get(toKey)! + count.get(fromKey)!));
      }
    }
  }
  const exitKey = key(exit.row, exit.col);
  const length = dist.get(exitKey);
  if (length === undefined) {
    return { count: 0 as 0 | 1 | 2, length: null, path: null };
  }
  const path = [exit];
  for (let at = exit; parent.has(key(at.row, at.col)); ) {
    at = parent.get(key(at.row, at.col))!;
    path.unshift(at);
  }
  return { count: count.get(exitKey)! as 1 | 2, length, path };
}
