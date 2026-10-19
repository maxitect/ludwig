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
    [...line].map((digit, col) => ({ row, col, region: Number(digit) })),
  );
}

/** The grid has `size²` cells in `size` edge-connected regions, and the puzzle has exactly one solution. */
export function verifyStarBattle({ size, stars, grid }: Content) {
  if (grid.length !== size) {
    throw new Error(`the grid has ${grid.length} rows, not ${size}`);
  }
  const ragged = grid.findIndex((line) => line.length !== size);
  if (ragged !== -1) {
    throw new Error(
      `row ${ragged + 1} has ${grid[ragged].length} cells, not ${size}`,
    );
  }
  const cells = regionCells({ grid });
  const names = [...new Set(cells.map(({ region }) => region))].sort();
  if (names.length !== size || names.some((name, i) => name !== i)) {
    throw new Error(
      `the grid has ${names.length} regions named ${names.join(", ")}, not regions 0 to ${size - 1}`,
    );
  }
  const regionOf = new Map(
    cells.map(({ row, col, region }) => [cellKey(row, col), region]),
  );
  for (const region of names) {
    const members = cells.filter((cell) => cell.region === region);
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
    size,
    stars,
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
