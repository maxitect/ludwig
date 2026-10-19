import { cellKey } from "../_shared/cell-grid/navigation";
import { countSolutions } from "./engine";
import type { Content } from "./schema";

const NEIGHBOURS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

/** The cells of the written grid as `{ row, col, region }`. */
export function regionCells({ grid }: Pick<Content, "grid">) {
  return grid.flatMap((line, row) =>
    [...line].map((digit, col) => ({ row, col, region: parseInt(digit, 36) })),
  );
}

/** The grid has `rows × cols` cells in edge-connected regions of at least two cells, and the puzzle has exactly one solution. */
export function verifyNorinori({ rows, cols, grid }: Content) {
  if (grid.length !== rows) {
    throw new Error(`the grid has ${grid.length} rows, not ${rows}`);
  }
  const ragged = grid.findIndex((line) => line.length !== cols);
  if (ragged !== -1) {
    throw new Error(
      `row ${ragged + 1} has ${grid[ragged].length} cells, not ${cols}`,
    );
  }
  const cells = regionCells({ grid });
  const names = [...new Set(cells.map(({ region }) => region))].sort(
    (a, b) => a - b,
  );
  if (names.some((name, i) => name !== i)) {
    throw new Error(
      `the regions are named ${names.join(", ")}, not 0 to ${names.length - 1}`,
    );
  }
  const regionOf = new Map(
    cells.map(({ row, col, region }) => [cellKey(row, col), region]),
  );
  for (const region of names) {
    const members = cells.filter((cell) => cell.region === region);
    if (members.length < 2) {
      throw new Error(`region ${region} has ${members.length} cell, not at least 2`);
    }
    const reached = new Set([cellKey(members[0].row, members[0].col)]);
    const queue = [members[0]];
    for (let next = queue.pop(); next; next = queue.pop()) {
      for (const [dr, dc] of NEIGHBOURS) {
        const row = next.row + dr;
        const col = next.col + dc;
        const key = cellKey(row, col);
        if (reached.has(key) || regionOf.get(key) !== region) continue;
        reached.add(key);
        queue.push({ row, col, region });
      }
    }
    if (reached.size !== members.length) {
      throw new Error(`region ${region} is not edge-connected`);
    }
  }
  const count = countSolutions({
    rows,
    cols,
    regionOf: cells.map(({ region }) => region),
  });
  if (count !== 1) {
    throw new Error(
      count === 0
        ? "the puzzle has no solution"
        : "the puzzle has more than one solution",
    );
  }
}
