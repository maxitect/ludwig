import { visibleCells } from "../_shared/visibility";
import type { Payload, Solution } from "./schema";

type Layout = Pick<Payload, "rows" | "cols" | "obstacles" | "observers">;

const key = (row: number, col: number) => `${row},${col}`;

/** The floor cells that no observer can see, in reading order. Observers see their own cell. */
export function deriveBlindSpots({
  rows,
  cols,
  obstacles,
  observers,
}: Layout): Solution {
  const blocked = new Set(obstacles.map(({ row, col }) => key(row, col)));
  const grid = {
    rows,
    cols,
    isBlocked: (row: number, col: number) => blocked.has(key(row, col)),
  };
  const seen = new Set(
    observers.flatMap(({ row, col, facing, fovDeg }) =>
      visibleCells(grid, { row, col, facing, fov_deg: fovDeg }).map((cell) =>
        key(cell.row, cell.col),
      ),
    ),
  );
  const blind: Solution = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const k = key(row, col);
      if (!blocked.has(k) && !seen.has(k)) blind.push({ row, col });
    }
  }
  return blind;
}

/** What stands on a cell, for its accessible name. */
export function describeCell(
  { obstacles, observers, targetRow, targetCol }: Payload,
  row: number,
  col: number,
) {
  const parts: string[] = [];
  if (obstacles.some((o) => o.row === row && o.col === col)) {
    parts.push("pillar");
  }
  const observer = observers.find((o) => o.row === row && o.col === col);
  if (observer) {
    parts.push(
      `observer facing ${observer.facing.toUpperCase()}, ${observer.fovDeg} degree view`,
    );
  }
  if (row === targetRow && col === targetCol) parts.push("the alcove");
  return parts.length ? parts.join(", ") : "floor";
}
