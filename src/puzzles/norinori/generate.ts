import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { countSolutions } from "./engine";
import { solveLayout } from "./grade";
import type { Content } from "./schema";

const MAX_CANDIDATES = 4000;
const MAX_CELLS_PER_REGION = 7;
const PLANT_TRIES = 4;
const CASCADE_TRIES = 6;
const HARDEN_STEPS = 80;

type Shape = { rows: number; cols: number };

/** Square grids that grow with the difficulty. */
const sizesFor = (difficulty: Difficulty): ReadonlyArray<number> => {
  switch (difficulty) {
    case 1:
      return [5, 6];
    case 2:
      return [6, 7];
    case 3:
      return [7, 8];
    case 4:
      return [8, 9];
    case 5:
      return [9, 10];
  }
};

/** The most cells a region may have. */
const maxRegionFor = (difficulty: Difficulty) => (difficulty <= 2 ? 8 : 10);

/** The share of dominoes that stay a region of two cells, the natural starting points of a solve. */
const anchorShareFor = (difficulty: Difficulty) => 0.4 - 0.07 * difficulty;

function neighboursOf(index: number, { rows, cols }: Shape) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const next: number[] = [];
  if (row > 0) next.push(index - cols);
  if (row < rows - 1) next.push(index + cols);
  if (col > 0) next.push(index - 1);
  if (col < cols - 1) next.push(index + 1);
  return next;
}

/**
 * The densest of `PLANT_TRIES` maximal packings of non-touching dominoes, as pairs of cell indexes:
 * dominoes are laid in random order until no more fit. Maximal means no two empty cells sit side by
 * side out of reach of every domino, which a solver could never clear. Null when fewer than one
 * domino per `MAX_CELLS_PER_REGION` cells fit.
 */
function plantDominoes(rng: () => number, shape: Shape) {
  const { rows, cols } = shape;
  const all = Array.from({ length: rows * cols }, (_, index) => index).flatMap(
    (index) => {
      const found: number[][] = [];
      if (index % cols < cols - 1) found.push([index, index + 1]);
      if (index < (rows - 1) * cols) found.push([index, index + cols]);
      return found;
    },
  );
  let best: number[][] = [];
  for (let attempt = 0; attempt < PLANT_TRIES; attempt++) {
    const shaded = new Set<number>();
    const dominoes: number[][] = [];
    for (const domino of shuffle(rng, all)) {
      const blocked = domino.some(
        (index) =>
          shaded.has(index) ||
          neighboursOf(index, shape).some((next) => shaded.has(next)),
      );
      if (blocked) continue;
      for (const index of domino) shaded.add(index);
      dominoes.push(domino);
    }
    if (dominoes.length > best.length) best = dominoes;
  }
  return best.length * MAX_CELLS_PER_REGION >= rows * cols ? best : null;
}

/**
 * Regions laid out so that the simplest techniques solve them in order: region k is its domino plus
 * cells a solver has emptied by the time regions 0 to k-1 are done, which are the cells beside an
 * earlier domino, and cells beside no domino at all once their neighbours are empty. The first
 * `anchors` regions are bare dominoes. Each empty cell joins the smallest eligible region beside
 * it, the cells with the fewest choices first. Null when a cell has no eligible region.
 */
function cascade(
  rng: () => number,
  shape: Shape,
  dominoes: ReadonlyArray<ReadonlyArray<number>>,
  anchors: number,
) {
  const cells = shape.rows * shape.cols;
  const regionOf = Array<number>(cells).fill(-1);
  dominoes.forEach((domino, region) => {
    for (const index of domino) regionOf[index] = region;
  });
  const dominoAt = [...regionOf];
  const clearedAt = Array<number>(cells).fill(-1);
  for (let index = 0; index < cells; index++) {
    if (dominoAt[index] !== -1) continue;
    const beside = neighboursOf(index, shape)
      .map((next) => dominoAt[next])
      .filter((region) => region !== -1);
    if (beside.length) clearedAt[index] = Math.min(...beside);
  }
  for (let index = 0; index < cells; index++) {
    if (dominoAt[index] !== -1 || clearedAt[index] !== -1) continue;
    const beside = neighboursOf(index, shape).map((next) => clearedAt[next]);
    if (beside.includes(-1)) return null;
    clearedAt[index] = Math.max(...beside);
  }
  const sizes = dominoes.map(() => 2);
  for (;;) {
    const choices = regionOf
      .flatMap((of, index) => (of === -1 ? [index] : []))
      .map((index) => ({
        index,
        options: [
          ...new Set(neighboursOf(index, shape).map((next) => regionOf[next])),
        ].filter((region) => region >= anchors && region > clearedAt[index]),
      }));
    if (!choices.length) return regionOf;
    const open = shuffle(
      rng,
      choices.filter(({ options }) => options.length),
    ).sort((a, b) => a.options.length - b.options.length);
    if (!open.length) return null;
    const { index, options } = open[0];
    const region = shuffle(rng, options).sort((a, b) => sizes[a] - sizes[b])[0];
    regionOf[index] = region;
    sizes[region]++;
  }
}

/**
 * The dominoes in the order the cascade resolves them: those with the most cells only they can
 * clear come first, since such a cell must join a later region, with random tie-breaks.
 */
function solveOrder(
  rng: () => number,
  shape: Shape,
  dominoes: ReadonlyArray<ReadonlyArray<number>>,
) {
  const dominoAt = Array<number>(shape.rows * shape.cols).fill(-1);
  dominoes.forEach((domino, i) => {
    for (const index of domino) dominoAt[index] = i;
  });
  const privateCells = dominoes.map(() => 0);
  dominoAt.forEach((at, index) => {
    if (at !== -1) return;
    const beside = new Set(
      neighboursOf(index, shape)
        .map((next) => dominoAt[next])
        .filter((i) => i !== -1),
    );
    if (beside.size === 1) privateCells[[...beside][0]]++;
  });
  return shuffle(rng, dominoes).sort(
    (a, b) =>
      privateCells[dominoes.indexOf(b)] - privateCells[dominoes.indexOf(a)],
  );
}

/** Whether the region's cells are in one piece. */
function connected(regionOf: readonly number[], shape: Shape, region: number) {
  const members = regionOf.flatMap((of, index) =>
    of === region ? [index] : [],
  );
  const seen = new Set([members[0]]);
  const queue = [members[0]];
  for (let head = 0; head < queue.length; head++) {
    for (const next of neighboursOf(queue[head], shape)) {
      if (regionOf[next] === region && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === members.length;
}

type Move = ReadonlyArray<{ cell: number; to: number }>;

/**
 * A random change of region boundaries that keeps the planted dominoes a solution: a cell beside
 * another region moves into it, or two planted cells of neighbouring regions, each beside the
 * other's region, swap regions so their dominoes cross the border. Null when a region would come
 * apart.
 */
function randomMove(
  rng: () => number,
  shape: Shape,
  regionOf: number[],
  planted: ReadonlySet<number>,
): Move | null {
  const cell = Math.floor(rng() * regionOf.length);
  const from = regionOf[cell];
  const to = shuffle(
    rng,
    [
      ...new Set(neighboursOf(cell, shape).map((next) => regionOf[next])),
    ].filter((region) => region !== from),
  )[0];
  if (to === undefined) return null;
  const partner = planted.has(cell)
    ? shuffle(
        rng,
        regionOf.flatMap((of, index) =>
          of === to &&
          planted.has(index) &&
          neighboursOf(index, shape).some((next) => regionOf[next] === from)
            ? [index]
            : [],
        ),
      )[0]
    : undefined;
  if (planted.has(cell) && partner === undefined) return null;
  const move: Move =
    partner === undefined
      ? [{ cell, to }]
      : [
          { cell, to },
          { cell: partner, to: from },
        ];
  const before = move.map(({ cell }) => regionOf[cell]);
  for (const { cell, to } of move) regionOf[cell] = to;
  const whole =
    connected(regionOf, shape, from) && connected(regionOf, shape, to);
  move.forEach(({ cell }, i) => (regionOf[cell] = before[i]));
  return whole ? move : null;
}

function toContent(
  { rows, cols }: Shape,
  regionOf: readonly number[],
): Content {
  return {
    rows,
    cols,
    grid: Array.from({ length: rows }, (_, row) =>
      regionOf
        .slice(row * cols, (row + 1) * cols)
        .map((region) => region.toString(36))
        .join(""),
    ),
  };
}

/** Rejects a region of more than `maxCells`, and a region that is one straight line of more than four cells. */
function wellShaped(
  regionOf: readonly number[],
  { cols }: Shape,
  maxCells: number,
) {
  const byRegion = new Map<number, number[]>();
  regionOf.forEach((region, index) => {
    byRegion.set(region, [...(byRegion.get(region) ?? []), index]);
  });
  for (const cells of byRegion.values()) {
    if (cells.length > maxCells) return false;
    if (cells.length <= 4) continue;
    const rows = new Set(cells.map((index) => Math.floor(index / cols)));
    const columns = new Set(cells.map((index) => index % cols));
    if (rows.size === 1 || columns.size === 1) return false;
  }
  return true;
}

/**
 * Walks the cascade towards the target difficulty: random moves are kept while the techniques up to
 * the target still solve the layout, and the walk stops once the hardest technique needed is the
 * target's. Returns that grade, or null when the steps run out.
 */
function harden(
  rng: () => number,
  shape: Shape,
  regionOf: number[],
  planted: ReadonlySet<number>,
  difficulty: Difficulty,
) {
  const layout = { ...shape, regionOf };
  let grade = solveLayout(layout, difficulty)?.grade ?? null;
  for (let step = 0; step < HARDEN_STEPS && grade; step++) {
    if (grade.difficulty === difficulty) return grade;
    const move = randomMove(rng, shape, regionOf, planted);
    if (!move) continue;
    const before = move.map(({ cell }) => regionOf[cell]);
    for (const { cell, to } of move) regionOf[cell] = to;
    const after = solveLayout(layout, difficulty)?.grade;
    if (after) grade = after;
    else move.forEach(({ cell }, i) => (regionOf[cell] = before[i]));
  }
  return grade?.difficulty === difficulty ? grade : null;
}

/**
 * Version 1: a maximal packing of non-touching dominoes, regions laid around them so that the
 * simplest techniques solve the grid region by region, then region boundaries walked at random
 * (cells changing region, planted cells swapped so dominoes cross borders) while the techniques up
 * to the target difficulty still solve it, until the hardest technique needed is the target's.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const sizes = sizesFor(difficulty);
  const anchorShare = anchorShareFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const size = sizes[Math.floor(rng() * sizes.length)];
    const shape = { rows: size, cols: size };
    const dominoes = plantDominoes(rng, shape);
    if (!dominoes) return null;
    const anchors = Math.round(dominoes.length * anchorShare);
    let regionOf: number[] | null = null;
    for (let attempt = 0; attempt < CASCADE_TRIES && !regionOf; attempt++) {
      regionOf = cascade(rng, shape, solveOrder(rng, shape, dominoes), anchors);
    }
    if (!regionOf) return null;
    const grade = harden(
      rng,
      shape,
      regionOf,
      new Set(dominoes.flat()),
      difficulty,
    );
    if (!grade || !wellShaped(regionOf, shape, maxRegionFor(difficulty)))
      return null;
    if (countSolutions({ ...shape, regionOf }) !== 1) return null;
    return {
      content: toContent(shape, regionOf),
      difficulty: grade.difficulty,
    };
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const norinoriGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
