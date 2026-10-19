import type { Payload } from "./schema";

/** A cell index is `row * cols + col`; `regionOf[index]` names its region. */
export type Layout = {
  rows: number;
  cols: number;
  regionOf: readonly number[];
};

export function layoutOf({ rows, cols, regions }: Payload): Layout {
  const regionOf = Array<number>(rows * cols).fill(-1);
  for (const { row, col, region } of regions) regionOf[row * cols + col] = region;
  return { rows, cols, regionOf };
}

/** The indexes of the cells that share an edge with `index`. */
function neighboursOf({ rows, cols }: Layout, index: number) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const found: number[] = [];
  if (row > 0) found.push(index - cols);
  if (row < rows - 1) found.push(index + cols);
  if (col > 0) found.push(index - 1);
  if (col < cols - 1) found.push(index + 1);
  return found;
}

/**
 * Up to `limit` solutions, found region by region. Each region takes two cells, and a branch is dropped as soon as
 * a shaded cell has two shaded neighbours, or has none and no undecided neighbour left to shade.
 * In a solution every shaded cell has exactly one shaded neighbour, so no domino touches another along an edge.
 */
export function solutions(layout: Layout, limit = Infinity): number[][] {
  const { regionOf } = layout;
  const cells = regionOf.length;
  const neighbours = Array.from({ length: cells }, (_, i) =>
    neighboursOf(layout, i),
  );
  const members = new Map<number, number[]>();
  regionOf.forEach((region, index) => {
    members.set(region, [...(members.get(region) ?? []), index]);
  });
  const order = [...members.keys()].sort(
    (a, b) => members.get(a)![0] - members.get(b)![0],
  );
  const shaded = Array<boolean>(cells).fill(false);
  const decided = new Set<number>();
  const found: number[][] = [];

  const viable = (index: number) => {
    const count = neighbours[index].filter((next) => shaded[next]).length;
    if (count > 1) return false;
    return (
      count === 1 ||
      neighbours[index].some((next) => !decided.has(regionOf[next]))
    );
  };

  const place = (at: number) => {
    if (found.length >= limit) return;
    if (at === order.length) {
      found.push(shaded.flatMap((on, index) => (on ? [index] : [])));
      return;
    }
    const region = order[at];
    const own = members.get(region)!;
    const touched = new Set(own.flatMap((index) => [index, ...neighbours[index]]));
    decided.add(region);
    for (let i = 0; i < own.length; i++) {
      for (let j = i + 1; j < own.length; j++) {
        shaded[own[i]] = shaded[own[j]] = true;
        if ([...touched].every((index) => !shaded[index] || viable(index))) {
          place(at + 1);
        }
        shaded[own[i]] = shaded[own[j]] = false;
      }
    }
    decided.delete(region);
  };

  place(0);
  return found;
}

/** How many solutions the layout has, counting no further than `limit`. */
export const countSolutions = (layout: Layout, limit = 2) =>
  solutions(layout, limit).length;

/** The first solution, or null when there is none. */
export const solve = (layout: Layout) => solutions(layout, 1)[0] ?? null;

/** The shaded cells with more than one shaded neighbour, and those in a region holding more than two shaded cells. */
export function conflictingIndexes(
  layout: Layout,
  shadedIndexes: Iterable<number>,
) {
  const all = new Set(shadedIndexes);
  const conflicts = new Set<number>();
  const perRegion = new Map<number, number[]>();
  for (const index of all) {
    if (neighboursOf(layout, index).filter((next) => all.has(next)).length > 1) {
      conflicts.add(index);
    }
    const region = layout.regionOf[index];
    perRegion.set(region, [...(perRegion.get(region) ?? []), index]);
  }
  for (const members of perRegion.values()) {
    if (members.length > 2) for (const index of members) conflicts.add(index);
  }
  return conflicts;
}

/** The shaded cells with no shaded neighbour: part of no domino. */
export function loneIndexes(layout: Layout, shadedIndexes: Iterable<number>) {
  const all = new Set(shadedIndexes);
  return new Set(
    [...all].filter(
      (index) => !neighboursOf(layout, index).some((next) => all.has(next)),
    ),
  );
}
