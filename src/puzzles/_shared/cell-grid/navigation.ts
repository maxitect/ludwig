export type Direction = "across" | "down";

export type CellPosition = { row: number; col: number };

export type CellKey = `${number},${number}`;

export const cellKey = (row: number, col: number): CellKey => `${row},${col}`;

export const DIRECTION_STEP: Record<Direction, CellPosition> = {
  across: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
};

type Bounds = { rows: number; cols: number; cells: ReadonlySet<CellKey> };

/** Next playable cell in a straight line, skipping blocks; null when the edge is reached first. */
export function stepToPlayable(
  { rows, cols, cells }: Bounds,
  from: CellPosition,
  delta: CellPosition,
): CellPosition | null {
  let row = from.row + delta.row;
  let col = from.col + delta.col;
  while (row >= 0 && row < rows && col >= 0 && col < cols) {
    if (cells.has(cellKey(row, col))) return { row, col };
    row += delta.row;
    col += delta.col;
  }
  return null;
}

/** Playable cells in reading order. */
export function readingOrder({ rows, cols, cells }: Bounds): CellPosition[] {
  const order: CellPosition[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (cells.has(cellKey(row, col))) order.push({ row, col });
    }
  }
  return order;
}

/** Start of the next (or previous) entry from the active cell; null when there is none, so Tab can leave the grid. */
export function adjacentEntry(
  bounds: Bounds,
  words: ReadonlyArray<ReadonlyArray<CellPosition>> | undefined,
  active: CellPosition,
  offset: 1 | -1,
): CellPosition | null {
  if (words) {
    const current = words.findIndex((word) =>
      word.some((c) => c.row === active.row && c.col === active.col),
    );
    const fallback = offset === 1 ? 0 : words.length - 1;
    return words[current === -1 ? fallback : current + offset]?.[0] ?? null;
  }
  const order = readingOrder(bounds);
  const index = order.findIndex(
    (c) => c.row === active.row && c.col === active.col,
  );
  return order[index + offset] ?? null;
}
