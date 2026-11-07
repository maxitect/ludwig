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

const COMPASS_WORD = {
  n: "north",
  ne: "north-east",
  e: "east",
  se: "south-east",
  s: "south",
  sw: "south-west",
  w: "west",
  nw: "north-west",
} as const satisfies Record<Payload["observers"][number]["facing"], string>;

/** An observer by name, facing and view, for labels and accessible names. */
export function describeObserver({
  name,
  facing,
  fovDeg,
}: Payload["observers"][number]) {
  return `${name}, facing ${COMPASS_WORD[facing]}, ${fovDeg} degrees`;
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
    parts.push(describeObserver(observer));
  }
  if (row === targetRow && col === targetCol) parts.push("the alcove");
  return parts.length ? parts.join(", ") : "floor";
}
