const FACING_DEG = {
  n: 0,
  ne: 45,
  e: 90,
  se: 135,
  s: 180,
  sw: 225,
  w: 270,
  nw: 315,
} as const;

const EPSILON_DEG = 1e-9;

type Cell = { row: number; col: number };

type Grid = {
  rows: number;
  cols: number;
  isBlocked: (row: number, col: number) => boolean;
};

type Observer = Cell & {
  facing: keyof typeof FACING_DEG;
  fov_deg: number;
  range_cells?: number | null;
};

type Point = { x: number; y: number };

/**
 * Supercover ray between cell centres, walked in integer arithmetic.
 * The two end cells never block. When the ray passes exactly through a
 * grid corner, it is blocked only if both cells flanking that corner are
 * obstacles (a diagonal cannot squeeze between two diagonal obstacles);
 * a single obstacle at a corner touch does not block.
 */
export function lineOfSight(grid: Grid, from: Cell, to: Cell): boolean {
  if (from.row === to.row && from.col === to.col) return true;
  const sx = to.col > from.col ? 1 : -1;
  const sy = to.row > from.row ? 1 : -1;
  const adx = Math.abs(to.col - from.col);
  const ady = Math.abs(to.row - from.row);
  const dx = adx * 2;
  const dy = ady * 2;
  let col = from.col;
  let row = from.row;
  let error = adx - ady;

  for (let steps = 1 + adx + ady; steps > 0; steps--) {
    const isEnd =
      (row === from.row && col === from.col) ||
      (row === to.row && col === to.col);
    if (!isEnd && grid.isBlocked(row, col)) return false;

    if (error > 0) {
      col += sx;
      error -= dy;
    } else if (error < 0) {
      row += sy;
      error += dx;
    } else {
      if (grid.isBlocked(row, col + sx) && grid.isBlocked(row + sy, col)) {
        return false;
      }
      col += sx;
      row += sy;
      error += dx - dy;
      steps--;
    }
  }
  return true;
}

/**
 * Whether the target cell centre lies inside the observer's view cone.
 * Facing n is up (row decreasing), bearings run clockwise. The half-angle
 * boundary is inclusive. `range_cells` is a Euclidean limit between cell
 * centres, inclusive. The observer's own cell is always inside.
 */
export function inCone(observer: Observer, target: Cell): boolean {
  const dRow = target.row - observer.row;
  const dCol = target.col - observer.col;
  if (dRow === 0 && dCol === 0) return true;

  if (
    observer.range_cells != null &&
    dRow * dRow + dCol * dCol > observer.range_cells * observer.range_cells
  ) {
    return false;
  }

  const bearing = (Math.atan2(dCol, -dRow) * 180) / Math.PI;
  const diff = Math.abs(
    ((bearing - FACING_DEG[observer.facing] + 540) % 360) - 180,
  );
  return diff <= observer.fov_deg / 2 + EPSILON_DEG;
}

/** Non-obstacle cells inside the observer's cone with clear line of sight. */
export function visibleCells(grid: Grid, observer: Observer): Cell[] {
  const visible: Cell[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      if (grid.isBlocked(row, col)) continue;
      const cell = { row, col };
      if (inCone(observer, cell) && lineOfSight(grid, observer, cell)) {
        visible.push(cell);
      }
    }
  }
  return visible;
}

/** Whether segment a-b touches the disc; a tangent counts as a hit. */
export function segmentHitsDisc(
  a: Point,
  b: Point,
  centre: Point,
  radius: number,
): boolean {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSq = abx * abx + aby * aby;
  const t =
    lengthSq === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((centre.x - a.x) * abx + (centre.y - a.y) * aby) / lengthSq,
          ),
        );
  const dx = a.x + t * abx - centre.x;
  const dy = a.y + t * aby - centre.y;
  return dx * dx + dy * dy <= radius * radius;
}
