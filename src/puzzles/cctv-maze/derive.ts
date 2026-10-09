import { visibleCells } from "../_shared/visibility";
import type { Content, Solution } from "./schema";

type Walled = Pick<Content, "rows" | "cols" | "walls">;
type Layout = Walled & Pick<Content, "cameras">;
type Side = "north" | "south" | "west" | "east";

const key = (row: number, col: number) => `${row},${col}`;

/**
 * Whether a wall stands on the given side of a cell. Only north and west walls are stored: a
 * cell's south wall is the north wall of the cell below, its east wall the west wall of the cell
 * to the right. The outer boundary is always a wall.
 */
export function hasWall(
  { rows, cols, walls }: Walled,
  row: number,
  col: number,
  side: Side,
) {
  const [wallRow, wallCol, stored] = ({
    north: [row, col, "north"],
    west: [row, col, "west"],
    south: [row + 1, col, "north"],
    east: [row, col + 1, "west"],
  } as const)[side];
  if (wallRow >= rows || wallCol >= cols) return true;
  if (stored === "north" && wallRow === 0) return true;
  if (stored === "west" && wallCol === 0) return true;
  return walls.some(
    (wall) =>
      wall.row === wallRow && wall.col === wallCol && wall.side === stored,
  );
}

/** Whether the two cells are edge neighbours with no wall between them. */
export function canStep(
  layout: Walled,
  from: { row: number; col: number },
  to: { row: number; col: number },
) {
  const dRow = to.row - from.row;
  const dCol = to.col - from.col;
  if (Math.abs(dRow) + Math.abs(dCol) !== 1) return false;
  const side: Side =
    dRow === -1 ? "north" : dRow === 1 ? "south" : dCol === -1 ? "west" : "east";
  return !hasWall(layout, from.row, from.col, side);
}

/**
 * The cells some camera can see, in reading order. A camera sees its own cell, and its view
 * passes through maze walls: the cones are laid over the street plan.
 */
export function deriveSeen({ rows, cols, cameras }: Layout): Solution["seen"] {
  const grid = { rows, cols, isBlocked: () => false };
  const seen = new Set(
    cameras.flatMap(({ row, col, facing, fovDeg, rangeCells }) =>
      visibleCells(grid, {
        row,
        col,
        facing,
        fov_deg: fovDeg,
        range_cells: rangeCells,
      }).map((c) => key(c.row, c.col)),
    ),
  );
  const cells: Solution["seen"] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (seen.has(key(row, col))) cells.push({ row, col });
    }
  }
  return cells;
}
