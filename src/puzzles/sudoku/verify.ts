import { cellKey } from "../_shared/cell-grid/navigation";
import { countSolutions, unitsFor, variantFor } from "./engine";
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

const position = (row: number, col: number) =>
  `row ${row + 1}, column ${col + 1}`;

/** Cages never share a cell, each is one edge-connected piece, and its sum is one that distinct digits can make. */
function verifyCages(cages: NonNullable<Content["cages"]>) {
  const owner = new Map<string, number>();
  cages.forEach(({ cells }, id) => {
    for (const { row, col } of cells) {
      const key = cellKey(row, col);
      if (owner.has(key)) {
        throw new Error(`cell at ${position(row, col)} is in two cages`);
      }
      owner.set(key, id);
    }
  });
  cages.forEach(({ cells, sum }, id) => {
    const count = cells.length;
    if (count > SIZE) {
      throw new Error(`cage ${id} has ${count} cells, more than nine digits`);
    }
    const least = (count * (count + 1)) / 2;
    const most = (count * (19 - count)) / 2;
    if (sum < least || sum > most) {
      throw new Error(
        `cage ${id} cannot make ${sum} from ${count} distinct digits`,
      );
    }
    const reached = new Set([cellKey(cells[0].row, cells[0].col)]);
    const queue = [cells[0]];
    for (let next = queue.pop(); next; next = queue.pop()) {
      for (const [dr, dc] of NEIGHBOURS) {
        const row = next.row + dr;
        const col = next.col + dc;
        const key = cellKey(row, col);
        if (reached.has(key) || owner.get(key) !== id) continue;
        reached.add(key);
        queue.push({ row, col });
      }
    }
    if (reached.size !== count) {
      throw new Error(`cage ${id} is not edge-connected`);
    }
  });
}

/** Every mark sits between a cell and a neighbour on the grid, and no edge is marked twice. */
function verifyXv({ marks }: NonNullable<Content["xv"]>) {
  const seen = new Set<string>();
  for (const { row, col, direction } of marks) {
    const inside = direction === "right" ? col < SIZE - 1 : row < SIZE - 1;
    if (!inside) {
      throw new Error(
        `the ${direction} mark at ${position(row, col)} leaves the grid`,
      );
    }
    const key = `${cellKey(row, col)},${direction}`;
    if (seen.has(key)) {
      throw new Error(`duplicate ${direction} mark at ${position(row, col)}`);
    }
    seen.add(key);
  }
}

/** The givens occupy distinct cells, any regions, cages and marks are well formed, and the puzzle has exactly one completion. */
export function verifySudoku({ givens, regions, cages, xv }: Content) {
  const seen = new Set<string>();
  for (const { row, col } of givens) {
    const key = cellKey(row, col);
    if (seen.has(key)) {
      throw new Error(`duplicate given at ${position(row, col)}`);
    }
    seen.add(key);
  }
  if (regions) verifyRegions(regions);
  if (cages) verifyCages(cages);
  if (xv) verifyXv(xv);
  const solutions = countSolutions(
    givens,
    2,
    unitsFor(regions),
    variantFor({ cages, xv }),
  );
  if (solutions !== 1) {
    throw new Error(
      solutions === 0
        ? "the givens have no solution"
        : "the givens have more than one solution",
    );
  }
}
