import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { solutions } from "./engine";
import { gradeNorinori } from "./grade";
import type { Content } from "./schema";

const MAX_CANDIDATES = 4000;
const REPAIR_STEPS = 60;
const RIVALS = 10;
const SAMPLE = 8;
const MOVES = 25;
const MIN_REGION = 2;

type Shape = { rows: number; cols: number };

/** Square grids that grow with the difficulty. */
const sizesFor = (difficulty: Difficulty): ReadonlyArray<number> => {
  switch (difficulty) {
    case 1:
      return [5, 6];
    case 2:
      return [6, 7];
    case 3:
      return [6, 7];
    case 4:
      return [7, 8];
    case 5:
      return [7, 8];
  }
};

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

/** About one domino per five cells, none touching another along an edge: each as a pair of cell indexes. */
function placeDominoes(rng: () => number, shape: Shape) {
  const { rows, cols } = shape;
  const wanted = Math.round((rows * cols) / 5);
  const options = shuffle(
    rng,
    Array.from({ length: rows * cols }, (_, index) => index).flatMap((index) => {
      const found: number[][] = [];
      if (index % cols < cols - 1) found.push([index, index + 1]);
      if (index < (rows - 1) * cols) found.push([index, index + cols]);
      return found;
    }),
  );
  const shaded = new Set<number>();
  const dominoes: number[][] = [];
  for (const domino of options) {
    if (dominoes.length === wanted) break;
    const blocked = domino.some(
      (index) =>
        shaded.has(index) ||
        neighboursOf(index, shape).some((next) => shaded.has(next)),
    );
    if (blocked) continue;
    for (const index of domino) shaded.add(index);
    dominoes.push(domino);
  }
  return dominoes.length >= Math.ceil(wanted * 0.75) ? dominoes : null;
}

/** Shortest path between two cells through unclaimed, unshaded cells, or null. */
function pathBetween(
  from: number,
  to: number,
  shape: Shape,
  blocked: (index: number) => boolean,
) {
  const parent = Array<number>(shape.rows * shape.cols).fill(-1);
  parent[from] = from;
  const queue = [from];
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (at === to) {
      const path = [to];
      while (path[0] !== from) path.unshift(parent[path[0]]);
      return path;
    }
    for (const next of neighboursOf(at, shape)) {
      if (parent[next] !== -1 || (next !== to && blocked(next))) continue;
      parent[next] = at;
      queue.push(next);
    }
  }
  return null;
}

/**
 * Regions grown around the planted cells: each region owns two shaded cells, usually from nearby
 * dominoes and joined by a path, then the rest of the grid is claimed one cell at a time by a
 * region beside it, favouring big regions more at higher difficulties (`lumpiness` is the exponent of the weight). The planted cells stay a solution.
 */
function growRegions(
  rng: () => number,
  shape: Shape,
  dominoes: ReadonlyArray<ReadonlyArray<number>>,
  lumpiness: number,
) {
  const { rows, cols } = shape;
  const regionOf = Array<number>(rows * cols).fill(-1);
  const shaded = new Set(dominoes.flat());
  const distance = (a: number, b: number) =>
    Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) +
    Math.abs((a % cols) - (b % cols));
  const taken = new Set<number>();
  const pairs: number[][] = [];
  const candidates = [...shaded].flatMap((a) =>
    [...shaded].filter((b) => a < b).map((b) => ({
      pair: [a, b],
      cost:
        distance(a, b) +
        rng() * 2 -
        (dominoes.some(([x, y]) => x === a && y === b) ? 3 * rng() : 0),
    })),
  );
  for (const { pair } of candidates.sort((x, y) => x.cost - y.cost)) {
    if (pair.some((index) => taken.has(index))) continue;
    for (const index of pair) taken.add(index);
    pairs.push(pair);
  }
  let region = 0;
  for (const [first, second] of pairs.sort(
    (x, y) => distance(x[0], x[1]) - distance(y[0], y[1]),
  )) {
    const path = pathBetween(
      first,
      second,
      shape,
      (index) => regionOf[index] !== -1 || shaded.has(index),
    );
    if (!path) return null;
    for (const index of path) regionOf[index] = region;
    region++;
  }
  if (region > 36) return null;

  for (;;) {
    const frontier = regionOf.flatMap((of, index) =>
      of === -1 && neighboursOf(index, shape).some((n) => regionOf[n] !== -1)
        ? [index]
        : [],
    );
    if (!frontier.length) break;
    const cell = frontier[Math.floor(rng() * frontier.length)];
    const beside = neighboursOf(cell, shape)
      .filter((n) => regionOf[n] !== -1)
      .map((n) => regionOf[n]);
    const weight = (of: number) => regionOf.filter((r) => r === of).length ** lumpiness;
    let pick = rng() * beside.reduce((sum, of) => sum + weight(of), 0);
    regionOf[cell] = beside.find((of) => (pick -= weight(of)) < 0) ?? beside[0];
  }
  return regionOf.includes(-1) ? null : regionOf;
}

/** Whether the region minus one cell is still in one piece. */
function staysConnected(
  regionOf: readonly number[],
  shape: Shape,
  cell: number,
) {
  const region = regionOf[cell];
  const rest = regionOf.flatMap((of, index) =>
    of === region && index !== cell ? [index] : [],
  );
  const seen = new Set([rest[0]]);
  const queue = [rest[0]];
  for (let head = 0; head < queue.length; head++) {
    for (const next of neighboursOf(queue[head], shape)) {
      if (next !== cell && regionOf[next] === region && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === rest.length;
}

/** Every legal move of a cell: into a neighbouring region, keeping both regions whole. */
function movesFor(
  shape: Shape,
  regionOf: readonly number[],
  sizes: ReadonlyMap<number, number>,
  cell: number,
) {
  const from = regionOf[cell];
  if (sizes.get(from)! <= MIN_REGION || !staysConnected(regionOf, shape, cell)) {
    return [];
  }
  return [
    ...new Set(neighboursOf(cell, shape).map((next) => regionOf[next])),
  ]
    .filter((to) => to !== from)
    .map((to) => ({ cell, to }));
}

/**
 * Climbs towards a unique layout: each step applies the boundary move that leaves the fewest
 * solutions trying the cells the other solutions shade and a sample of the rest. Planted cells never move, so the planted solution stays valid.
 * True once the layout has exactly one solution.
 */
function repair(
  rng: () => number,
  shape: Shape,
  regionOf: number[],
  planted: ReadonlySet<number>,
) {
  const layout = { ...shape, regionOf };
  const sizes = new Map<number, number>();
  for (const region of regionOf) sizes.set(region, (sizes.get(region) ?? 0) + 1);
  const movable = regionOf.flatMap((_, index) =>
    planted.has(index) ? [] : [index],
  );
  const apply = (cell: number, to: number) => {
    sizes.set(regionOf[cell], sizes.get(regionOf[cell])! - 1);
    sizes.set(to, sizes.get(to)! + 1);
    regionOf[cell] = to;
  };
  for (let step = 0; step < REPAIR_STEPS; step++) {
    const found = solutions(layout, RIVALS);
    if (found.length === 1) return true;
    const rivals = found.flatMap((solution) =>
      solution.filter((index) => !planted.has(index)),
    );
    const cells = new Set([...rivals, ...shuffle(rng, movable).slice(0, SAMPLE)]);
    const moves = [...cells].flatMap((cell) =>
      movesFor(shape, regionOf, sizes, cell),
    );
    if (!moves.length) return false;
    let best: typeof moves = [];
    let bestCount = Infinity;
    for (const move of shuffle(rng, moves).slice(0, MOVES)) {
      const from = regionOf[move.cell];
      apply(move.cell, move.to);
      const count = solutions(layout, RIVALS).length;
      apply(move.cell, from);
      if (count > 0 && count < bestCount) {
        bestCount = count;
        best = [move];
      }
      if (count === 1) break;
    }
    if (!best.length) return false;
    const chosen = best[0];
    apply(chosen.cell, chosen.to);
  }
  return false;
}

function toContent({ rows, cols }: Shape, regionOf: readonly number[]): Content {
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

/**
 * Version 1: non-touching dominoes planted, regions drawn around them, then region boundaries
 * moved until the layout has exactly one solution. A candidate is kept when the technique grader
 * solves it at the target difficulty.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const sizes = sizesFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const size = sizes[Math.floor(rng() * sizes.length)];
    const shape = { rows: size, cols: size };
    const dominoes = placeDominoes(rng, shape);
    if (!dominoes) return null;
    const regionOf = growRegions(rng, shape, dominoes, 2);
    if (!regionOf) return null;
    if (!repair(rng, shape, regionOf, new Set(dominoes.flat()))) return null;
    const content = toContent(shape, regionOf);
    const grade = gradeNorinori(content, difficulty);
    return grade ? { content, difficulty: grade.difficulty } : null;
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const norinoriGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
