import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { solveFillomino } from "./grade";
import type { Content } from "./schema";

const MAX_CANDIDATES = 4000;
const PARTITION_TRIES = 8;
const MAX_AREA = 9;
const AREA_TRIES = 6;

type Shape = Pick<Content, "rows" | "cols">;

/** Grid sizes (square) by difficulty. */
const sizesFor = (difficulty: Difficulty): ReadonlyArray<number> => {
  switch (difficulty) {
    case 1:
    case 2:
      return [8];
    case 3:
      return [8, 10];
    case 4:
    case 5:
      return [10];
  }
};

/** Weight of each area size from 1 up: a one-cell area is dull, so only leftovers are that small. */
const SIZE_WEIGHTS = [0, 3, 4, 4, 4, 3, 2, 2, 1];

const MAX_ONES = 2;

function neighboursOf(index: number, { rows, cols }: Shape) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const next: number[] = [];
  if (row > 0) next.push(index - cols);
  if (col > 0) next.push(index - 1);
  if (col < cols - 1) next.push(index + 1);
  if (row < rows - 1) next.push(index + cols);
  return next;
}

function pickSize(rng: () => number) {
  const total = SIZE_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  let at = rng() * total;
  for (let size = 1; size <= SIZE_WEIGHTS.length; size++) {
    at -= SIZE_WEIGHTS[size - 1];
    if (at < 0) return size;
  }
  return 2;
}

/**
 * Grows one area from `start` to a random target size, on past it while its size matches a touching
 * area. Returns its cells (left assigned in `areaOf`), or none after freeing them when it got stuck.
 */
function growArea(
  rng: () => number,
  next: ReadonlyArray<ReadonlyArray<number>>,
  areaOf: number[],
  sizes: ReadonlyArray<number>,
  start: number,
  area: number,
) {
  const members = [start];
  areaOf[start] = area;
  let target = pickSize(rng);
  for (;;) {
    const touching = new Set<number>();
    const frontier = new Set<number>();
    for (const cell of members) {
      for (const beside of next[cell]) {
        if (areaOf[beside] === -1) frontier.add(beside);
        else if (areaOf[beside] !== area) touching.add(sizes[areaOf[beside]]);
      }
    }
    const fits = !touching.has(members.length);
    if (fits && (members.length >= target || !frontier.size)) return members;
    if (!frontier.size || members.length >= MAX_AREA) {
      for (const cell of members) areaOf[cell] = -1;
      return [];
    }
    const options = [...frontier];
    const grown = options[Math.floor(rng() * options.length)];
    areaOf[grown] = area;
    members.push(grown);
    if (members.length > target) target = members.length;
  }
}

/**
 * Cuts the grid into edge-connected areas by random growth, each from the free cell with the fewest
 * free neighbours so no pocket is left behind. An area is closed at its target size, or grown on
 * while that size matches a touching area, so no two touching areas are the same size (they would
 * merge). Null when an area cannot be closed at a size no neighbour has, or when too many are
 * single cells.
 */
function partition(rng: () => number, shape: Shape) {
  const cells = shape.rows * shape.cols;
  const next = Array.from({ length: cells }, (_, index) =>
    neighboursOf(index, shape),
  );
  const areaOf = Array<number>(cells).fill(-1);
  const sizes: number[] = [];
  let free = cells;
  let ones = 0;
  while (free > 0) {
    const freeDegree = (index: number) =>
      next[index].filter((beside) => areaOf[beside] === -1).length;
    let start = -1;
    let fewest = 5;
    for (const index of shuffle(
      rng,
      Array.from({ length: cells }, (_, i) => i),
    )) {
      if (areaOf[index] !== -1) continue;
      const degree = freeDegree(index);
      if (degree < fewest) {
        fewest = degree;
        start = index;
      }
    }
    const area = sizes.length;
    let members: number[] = [];
    for (let attempt = 0; attempt < AREA_TRIES && !members.length; attempt++) {
      members = growArea(rng, next, areaOf, sizes, start, area);
    }
    if (!members.length) return null;
    sizes.push(members.length);
    if (members.length === 1 && ++ones > MAX_ONES) return null;
    free -= members.length;
  }
  return areaOf.map((area) => sizes[area]);
}

/**
 * Version 1: a random partition into areas, every cell given its area's size, then givens removed
 * in random order while the techniques up to the target difficulty still solve the grid. The hardest
 * technique used must be the target's. Techniques that fill the grid prove its one solution, so the exact
 * search is never needed (it can take half a minute on a sparse unique grid).
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const sizes = sizesFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const size = sizes[Math.floor(rng() * sizes.length)];
    const shape = { rows: size, cols: size };
    let digits: number[] | null = null;
    for (let tries = 0; tries < PARTITION_TRIES && !digits; tries++) {
      digits = partition(rng, shape);
    }
    if (!digits) return null;
    const kept = digits.map(() => true);
    const contentOf = (): Content => ({
      ...shape,
      givens: digits.flatMap((digit, index) =>
        kept[index]
          ? [
              {
                row: Math.floor(index / shape.cols),
                col: index % shape.cols,
                digit,
              },
            ]
          : [],
      ),
    });
    for (const index of shuffle(
      rng,
      digits.map((_, i) => i),
    )) {
      kept[index] = false;
      if (!solveFillomino(contentOf(), difficulty)?.grade) kept[index] = true;
    }
    const content = contentOf();
    const grade = solveFillomino(content, difficulty)?.grade;
    return grade?.difficulty === difficulty
      ? { content, difficulty: grade.difficulty }
      : null;
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const fillominoGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
