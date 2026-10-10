import { cellKey } from "../_shared/cell-grid/navigation";
import { countSolutions, unitsFor } from "./engine";
import type { Content } from "./schema";

const SIZE = 9;
const NEIGHBOURS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

/** Every cell has one region, each region has nine cells, and a jigsaw region is a single edge-connected piece. */
function verifyRegions({ kind, cells }: NonNullable<Content["regions"]>) {
  const regionOf = new Map<string, number>();
  for (const { row, col, region } of cells) {
    const key = cellKey(row, col);
    if (regionOf.has(key)) {
      throw new Error(
        `duplicate region cell at row ${row + 1}, column ${col + 1}`,
      );
    }
    regionOf.set(key, region);
  }
  if (regionOf.size !== SIZE * SIZE) {
    throw new Error("the region set must cover all 81 cells");
  }
  for (let region = 0; region < SIZE; region++) {
    const members = cells.filter((cell) => cell.region === region);
    if (members.length !== SIZE) {
      throw new Error(`region ${region} has ${members.length} cells, not nine`);
    }
    if (kind !== "jigsaw") continue;
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
    if (reached.size !== SIZE) {
      throw new Error(`jigsaw region ${region} is not edge-connected`);
    }
  }
}

/** The givens occupy distinct cells, any regions are well formed, and the puzzle has exactly one completion. */
export function verifySudoku({ givens, regions }: Content) {
  const seen = new Set<string>();
  for (const { row, col } of givens) {
    const key = cellKey(row, col);
    if (seen.has(key)) {
      throw new Error(`duplicate given at row ${row + 1}, column ${col + 1}`);
    }
    seen.add(key);
  }
  if (regions) verifyRegions(regions);
  const solutions = countSolutions(givens, 2, unitsFor(regions));
  if (solutions !== 1) {
    throw new Error(
      solutions === 0
        ? "the givens have no solution"
        : "the givens have more than one solution",
    );
  }
}
