import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { solutions } from "./engine";
import { gradeStarBattle } from "./grade";
import type { Content } from "./schema";

const MAX_CANDIDATES = 4000;
const REPAIR_STEPS = 60;
const RIVALS = 2;

type Shape = { size: number; stars: number };

/** Easy puzzles are small with one star; the hardest are large, and two stars from size 8. */
const shapesFor = (difficulty: Difficulty): ReadonlyArray<Shape> => {
  const one = (...sizes: number[]) => sizes.map((size) => ({ size, stars: 1 }));
  const two = (...sizes: number[]) => sizes.map((size) => ({ size, stars: 2 }));
  switch (difficulty) {
    case 1:
      return one(5, 6);
    case 2:
      return one(6, 7);
    case 3:
      return [...one(7, 8), ...two(8)];
    case 4:
      return [...one(8, 9), ...two(8)];
    case 5:
      return one(9, 10);
  }
};

const rowOf = (index: number, size: number) => Math.floor(index / size);

function neighboursOf(index: number, size: number) {
  const row = rowOf(index, size);
  const col = index % size;
  const next: number[] = [];
  if (row > 0) next.push(index - size);
  if (row < size - 1) next.push(index + size);
  if (col > 0) next.push(index - 1);
  if (col < size - 1) next.push(index + 1);
  return next;
}

/** A random valid star placement, as cell indexes: `stars` per row and column, none touching. */
function randomPlacement(rng: () => number, { size, stars }: Shape) {
  const choices: number[][] = [];
  const pick = (from: number, chosen: number[]) => {
    if (chosen.length === stars) {
      choices.push(chosen);
      return;
    }
    for (let col = from; col < size; col++) pick(col + 2, [...chosen, col]);
  };
  pick(0, []);
  const columns = Array<number>(size).fill(0);
  const placed: number[] = [];

  function fill(row: number, previous: readonly number[]): boolean {
    if (row === size) return true;
    for (const cols of shuffle(rng, choices)) {
      if (
        cols.some(
          (col) =>
            columns[col] >= stars ||
            previous.some((above) => Math.abs(above - col) <= 1),
        )
      ) {
        continue;
      }
      for (const col of cols) columns[col]++;
      placed.push(...cols.map((col) => row * size + col));
      if (fill(row + 1, cols)) return true;
      placed.length -= cols.length;
      for (const col of cols) columns[col]--;
    }
    return false;
  }

  return fill(0, []) ? placed : null;
}

/** Shortest path between two cells through unclaimed cells, or null. */
function pathBetween(
  from: number,
  to: number,
  size: number,
  blocked: (index: number) => boolean,
) {
  const parent = new Map<number, number>([[from, from]]);
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (at === to) {
      const path = [to];
      while (path[0] !== from) path.unshift(parent.get(path[0]) as number);
      return path;
    }
    for (const next of neighboursOf(at, size)) {
      if (parent.has(next) || (next !== to && blocked(next))) continue;
      parent.set(next, at);
      queue.push(next);
    }
  }
  return null;
}

/**
 * Regions grown around a placement: each region owns `stars` of its stars (joined by a path when
 * there are two), then the rest of the grid is claimed one cell at a time by a random region
 * beside it. The placement stays a solution.
 */
function growRegions(
  rng: () => number,
  { size, stars }: Shape,
  placement: readonly number[],
) {
  const regionOf = Array<number>(size * size).fill(-1);
  const isStar = new Set(placement);
  if (stars === 1) {
    placement.forEach((index, region) => {
      regionOf[index] = region;
    });
  } else {
    const free = new Set(placement);
    let region = 0;
    for (const first of shuffle(rng, placement)) {
      if (!free.has(first)) continue;
      free.delete(first);
      const distance = (other: number) =>
        Math.abs(rowOf(other, size) - rowOf(first, size)) +
        Math.abs((other % size) - (first % size));
      const second = [...free].sort(
        (a, b) => distance(a) - distance(b) || a - b,
      )[0];
      free.delete(second);
      const path = pathBetween(
        first,
        second,
        size,
        (index) => regionOf[index] !== -1 || isStar.has(index),
      );
      if (!path) return null;
      for (const index of path) regionOf[index] = region;
      region++;
    }
  }

  const frontier = (region: number) =>
    regionOf.flatMap((of, index) =>
      of === -1 &&
      neighboursOf(index, size).some((next) => regionOf[next] === region)
        ? [index]
        : [],
    );
  while (regionOf.includes(-1)) {
    const regions = shuffle(
      rng,
      Array.from({ length: size }, (_, region) => region),
    ).filter((region) => frontier(region).length);
    if (!regions.length) return null;
    const cells = frontier(regions[0]);
    regionOf[cells[Math.floor(rng() * cells.length)]] = regions[0];
  }
  return regionOf;
}

/** Whether the region minus one cell is still in one piece. */
function staysConnected(
  regionOf: readonly number[],
  size: number,
  cell: number,
) {
  const region = regionOf[cell];
  const rest = regionOf.flatMap((of, index) =>
    of === region && index !== cell ? [index] : [],
  );
  const seen = new Set([rest[0]]);
  const queue = [rest[0]];
  for (let head = 0; head < queue.length; head++) {
    for (const next of neighboursOf(queue[head], size)) {
      if (next !== cell && regionOf[next] === region && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === rest.length;
}

/**
 * Kills the other solutions one at a time: a star of a rival solution is moved into a neighbouring
 * region, never touching the planted stars, so the planted solution stays valid. True once the
 * layout has exactly one solution.
 */
function repair(
  rng: () => number,
  { size, stars }: Shape,
  regionOf: number[],
  isStar: ReadonlySet<number>,
) {
  for (let step = 0; step < REPAIR_STEPS; step++) {
    const found = solutions({ size, stars, regionOf }, RIVALS);
    if (found.length === 1) return true;
    const rivalStars = found.flatMap((solution) =>
      solution.filter((index) => !isStar.has(index)),
    );
    const anywhere = Array.from({ length: regionOf.length }, (_, i) => i).filter(
      (index) => !isStar.has(index),
    );
    for (const cell of [...shuffle(rng, rivalStars), ...shuffle(rng, anywhere)]) {
      const from = regionOf[cell];
      const targets = [
        ...new Set(
          neighboursOf(cell, size)
            .map((next) => regionOf[next])
            .filter((region) => region !== from),
        ),
      ];
      const sizeOf = regionOf.filter((of) => of === from).length;
      if (
        !targets.length ||
        sizeOf <= stars + 2 ||
        !staysConnected(regionOf, size, cell)
      ) {
        continue;
      }
      regionOf[cell] = targets[Math.floor(rng() * targets.length)];
      break;
    }
  }
  return false;
}

/** Rejects a region of one or two cells, and a straight run longer than three cells. */
function wellShaped(regionOf: readonly number[], size: number, stars: number) {
  for (let region = 0; region < size; region++) {
    const cells = regionOf.flatMap((of, index) => (of === region ? [index] : []));
    if (cells.length < stars + 2) return false;
    const rows = new Set(cells.map((index) => rowOf(index, size)));
    const cols = new Set(cells.map((index) => index % size));
    if ((rows.size === 1 || cols.size === 1) && cells.length > 3) return false;
  }
  return true;
}

function toContent({ size, stars }: Shape, regionOf: readonly number[]): Content {
  return {
    size,
    stars,
    grid: Array.from({ length: size }, (_, row) =>
      regionOf.slice(row * size, (row + 1) * size).join(""),
    ),
  };
}

/**
 * Version 1: a random valid star placement, regions grown around it, then region boundaries moved
 * until the layout has exactly one solution. A candidate is kept when the technique grader solves
 * it at the target difficulty.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const shapes = shapesFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const shape = shapes[Math.floor(rng() * shapes.length)];
    const placement = randomPlacement(rng, shape);
    if (!placement) return null;
    const regionOf = growRegions(rng, shape, placement);
    if (!regionOf) return null;
    if (!repair(rng, shape, regionOf, new Set(placement))) return null;
    if (!wellShaped(regionOf, shape.size, shape.stars)) return null;
    const content = toContent(shape, regionOf);
    const grade = gradeStarBattle(content, difficulty);
    return grade ? { content, difficulty: grade.difficulty } : null;
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const starBattleGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
