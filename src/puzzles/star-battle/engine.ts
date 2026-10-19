import type { Payload } from "./schema";

/** A cell index is `row * size + col`; `regionOf[index]` names its region. */
export type Layout = {
  size: number;
  stars: number;
  regionOf: readonly number[];
};

export function layoutOf({ size, stars, regions }: Payload): Layout {
  const regionOf = Array<number>(size * size).fill(-1);
  for (const { row, col, region } of regions) regionOf[row * size + col] = region;
  return { size, stars, regionOf };
}

/** Every way to put `count` stars in one row with no two side by side, as column lists. */
function rowChoices(size: number, count: number) {
  const choices: number[][] = [];
  const pick = (from: number, chosen: number[]) => {
    if (chosen.length === count) {
      choices.push(chosen);
      return;
    }
    for (let col = from; col < size; col++) pick(col + 2, [...chosen, col]);
  };
  pick(0, []);
  return choices;
}

/**
 * Up to `limit` solutions, found row by row. Each row takes `stars` columns that are not side by side,
 * keeps every column and region within `stars`, and keeps clear of the previous row's stars.
 */
export function solutions(
  { size, stars, regionOf }: Layout,
  limit = Infinity,
): number[][] {
  const choices = rowChoices(size, stars);
  const columnCount = Array<number>(size).fill(0);
  const regionCount = Array<number>(size).fill(0);
  const found: number[][] = [];
  const placed: number[] = [];

  const place = (row: number, previous: readonly number[]) => {
    if (found.length >= limit) return;
    if (row === size) {
      found.push([...placed]);
      return;
    }
    for (const cols of choices) {
      if (cols.some((col) => previous.some((above) => Math.abs(above - col) <= 1)))
        continue;
      const taken: number[] = [];
      let ok = true;
      for (const col of cols) {
        const region = regionOf[row * size + col];
        if (columnCount[col] >= stars || regionCount[region] >= stars) {
          ok = false;
          break;
        }
        columnCount[col]++;
        regionCount[region]++;
        taken.push(col);
      }
      if (ok) {
        placed.push(...cols.map((col) => row * size + col));
        place(row + 1, cols);
        placed.length -= cols.length;
      }
      for (const col of taken) {
        columnCount[col]--;
        regionCount[regionOf[row * size + col]]--;
      }
    }
  };

  place(0, []);
  return found;
}

/** How many solutions the layout has, counting no further than `limit`. */
export const countSolutions = (layout: Layout, limit = 2) =>
  solutions(layout, limit).length;

/** The first solution, or null when there is none. */
export const solve = (layout: Layout) => solutions(layout, 1)[0] ?? null;

/** The stars that touch another star, even diagonally, or sit in a row, column or region holding more than `stars`. */
export function conflictingIndexes(
  { size, stars, regionOf }: Layout,
  starIndexes: Iterable<number>,
) {
  const all = [...new Set(starIndexes)];
  const conflicts = new Set<number>();
  const units = new Map<string, number[]>();
  for (const index of all) {
    const row = Math.floor(index / size);
    const col = index % size;
    for (const unit of [`r${row}`, `c${col}`, `g${regionOf[index]}`]) {
      units.set(unit, [...(units.get(unit) ?? []), index]);
    }
    for (const other of all) {
      if (
        other !== index &&
        Math.abs(Math.floor(other / size) - row) <= 1 &&
        Math.abs((other % size) - col) <= 1
      ) {
        conflicts.add(index);
      }
    }
  }
  for (const members of units.values()) {
    if (members.length > stars) for (const index of members) conflicts.add(index);
  }
  return conflicts;
}
