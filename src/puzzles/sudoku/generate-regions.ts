import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import {
  boxUnits,
  classicUnits,
  colUnits,
  countSolutions,
  type Grid,
  rowUnits,
  toSolution,
  type Units,
} from "./engine";
import { gradeSudoku } from "./grade";
import type { Content, Regions } from "./schema";

const SIZE = 9;
const CELLS = SIZE * SIZE;
const MAX_CANDIDATES = 4000;
const FILL_NODE_LIMIT = 20000;
const EXCHANGES = 400;

const neighbours = (index: number) => {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const out: number[] = [];
  if (row > 0) out.push(index - SIZE);
  if (row < SIZE - 1) out.push(index + SIZE);
  if (col > 0) out.push(index - 1);
  if (col < SIZE - 1) out.push(index + 1);
  return out;
};

/** Renumbers regions by first appearance in reading order, so equal partitions are equal arrays. */
function canonical(regionOf: ReadonlyArray<number>) {
  const ids = new Map<number, number>();
  return regionOf.map((region) => {
    if (!ids.has(region)) ids.set(region, ids.size);
    return ids.get(region)!;
  });
}

const unitsOfRegions = (regionOf: ReadonlyArray<number>): Units => {
  const units: number[][] = Array.from({ length: SIZE }, () => []);
  regionOf.forEach((region, cell) => units[region].push(cell));
  return units;
};

const isConnected = (regionOf: ReadonlyArray<number>, region: number) => {
  const cells = regionOf.flatMap((owner, cell) =>
    owner === region ? [cell] : [],
  );
  const seen = new Set([cells[0]]);
  const queue = [cells[0]];
  for (const cell of queue) {
    for (const next of neighbours(cell)) {
      if (regionOf[next] === region && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === cells.length;
};

/**
 * Nine edge-connected regions of nine cells. The boxes are reshaped by many random exchanges: a
 * cell passes to a touching region and a cell of that region passes back, each kept only while
 * both regions stay in one piece.
 */
function shapeJigsaw(rng: () => number) {
  const regionOf = Array.from(
    { length: CELLS },
    (_, cell) => Math.floor(cell / 27) * 3 + Math.floor((cell % SIZE) / 3),
  );
  const pick = <T>(items: ReadonlyArray<T>) =>
    items[Math.floor(rng() * items.length)];
  for (let step = 0; step < EXCHANGES; step++) {
    const out = Math.floor(rng() * CELLS);
    const to = pick(
      neighbours(out)
        .map((next) => regionOf[next])
        .filter((region) => region !== regionOf[out]),
    );
    if (to === undefined) continue;
    const from = regionOf[out];
    regionOf[out] = to;
    const back = pick(
      regionOf.flatMap((owner, cell) =>
        owner === to &&
        cell !== out &&
        neighbours(cell).some((next) => regionOf[next] === from)
          ? [cell]
          : [],
      ),
    );
    if (back !== undefined) regionOf[back] = from;
    if (
      back === undefined ||
      !isConnected(regionOf, from) ||
      !isConnected(regionOf, to)
    ) {
      regionOf[out] = from;
      if (back !== undefined) regionOf[back] = to;
    }
  }
  return canonical(regionOf);
}

const spans = (cells: ReadonlyArray<number>) => {
  const rows = cells.map((cell) => Math.floor(cell / SIZE));
  const cols = cells.map((cell) => cell % SIZE);
  return [
    Math.max(...rows) - Math.min(...rows) + 1,
    Math.max(...cols) - Math.min(...cols) + 1,
  ];
};

/** A partition that maps onto itself under a half turn or a transpose is trivially symmetric. */
function isSymmetric(regionOf: ReadonlyArray<number>) {
  const transforms = [
    (cell: number) => CELLS - 1 - cell,
    (cell: number) => (cell % SIZE) * SIZE + Math.floor(cell / SIZE),
  ];
  return transforms.some((transform) => {
    const image = canonical(
      regionOf.map((_, cell) => regionOf[transform(cell)]),
    );
    return image.every((region, cell) => region === regionOf[cell]);
  });
}

/** Rejects a region thinner than two cells or longer than six, and a symmetric layout. */
export function acceptableJigsaw(regionOf: ReadonlyArray<number>) {
  return (
    unitsOfRegions(regionOf).every((cells) => {
      const [height, width] = spans(cells);
      return Math.min(height, width) >= 2 && Math.max(height, width) <= 6;
    }) && !isSymmetric(regionOf)
  );
}

/**
 * Nine colour groups for a solved grid. A random Latin square gives each box a digit for every
 * group, so a group holds one cell of every box and every digit once, and the grid still solves.
 */
function colourGroups(grid: Grid, rng: () => number) {
  const boxes = shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const groups = shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  const digits = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const groupOf = Array<number>(CELLS).fill(0);
  boxUnits.forEach((cells, box) => {
    for (const cell of cells) {
      const shift = digits.indexOf(grid[cell]);
      groupOf[cell] = groups[(shift - boxes[box] + SIZE) % SIZE];
    }
  });
  return canonical(groupOf);
}

/** Rejects a group that lies in one line, and a symmetric layout. */
function acceptableRainbow(groupOf: ReadonlyArray<number>) {
  return (
    unitsOfRegions(groupOf).every((cells) => {
      const [height, width] = spans(cells);
      return Math.min(height, width) >= 2;
    }) && !isSymmetric(groupOf)
  );
}

/** A random completed grid for the units, or null when the backtracking budget runs out. */
export function randomSolvedGrid(units: Units, rng: () => number) {
  const unitsOf: number[][] = Array.from({ length: CELLS }, () => []);
  units.forEach((unit, id) => {
    for (const cell of unit) unitsOf[cell].push(id);
  });
  const used = Array<number>(units.length).fill(0);
  const grid: Grid = Array(CELLS).fill(0);
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let nodes = 0;

  function fill(index: number): boolean {
    if (index === CELLS) return true;
    if (++nodes > FILL_NODE_LIMIT) return false;
    for (const digit of shuffle(rng, digits)) {
      const mask = 1 << digit;
      if (unitsOf[index].some((id) => used[id] & mask)) continue;
      grid[index] = digit;
      for (const id of unitsOf[index]) used[id] |= mask;
      if (fill(index + 1)) return true;
      grid[index] = 0;
      for (const id of unitsOf[index]) used[id] &= ~mask;
      if (nodes > FILL_NODE_LIMIT) return false;
    }
    return false;
  }

  return fill(0) ? grid : null;
}

type Layout = { regions: Regions; units: Units; grid: Grid };

function jigsawLayout(rng: () => number): Layout | null {
  const regionOf = shapeJigsaw(rng);
  if (!acceptableJigsaw(regionOf)) return null;
  const units = [...rowUnits, ...colUnits, ...unitsOfRegions(regionOf)];
  const grid = randomSolvedGrid(units, rng);
  return grid && { regions: toRegions("jigsaw", regionOf), units, grid };
}

function rainbowLayout(rng: () => number): Layout | null {
  const grid = randomSolvedGrid(classicUnits, rng);
  if (!grid) return null;
  const groupOf = colourGroups(grid, rng);
  if (!acceptableRainbow(groupOf)) return null;
  const units = [...classicUnits, ...unitsOfRegions(groupOf)];
  return { regions: toRegions("rainbow", groupOf), units, grid };
}

function toRegions(
  kind: Regions["kind"],
  regionOf: ReadonlyArray<number>,
): Regions {
  return {
    kind,
    cells: regionOf.map((region, cell) => ({
      row: Math.floor(cell / SIZE),
      col: cell % SIZE,
      region,
    })),
  };
}

/**
 * Version 1: a seeded region layout (a jigsaw reshaped from the boxes, or rainbow colour groups
 * dealt from a Latin square), a random solved grid for it, then givens removed one at a time in a
 * shuffled order while the technique grader, held to the target difficulty, still solves the puzzle.
 */
function generateV1(layoutOf: (rng: () => number) => Layout | null) {
  return (seed: string, difficulty: Difficulty) =>
    generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
      const layout = layoutOf(rng);
      if (!layout) return null;
      const { regions, units, grid } = layout;
      let grade = gradeSudoku(grid, difficulty, units);
      if (!grade) return null;
      for (const index of shuffle(
        rng,
        Array.from({ length: CELLS }, (_, cell) => cell),
      )) {
        const kept = grid[index];
        grid[index] = 0;
        const next = gradeSudoku(grid, difficulty, units);
        if (next) {
          grade = next;
        } else {
          grid[index] = kept;
        }
      }
      const givens = toSolution(grid).filter(({ digit }) => digit !== 0);
      if (countSolutions(givens, 2, units) !== 1) return null;
      const content: Content = { givens, regions };
      return { content, difficulty: grade.difficulty };
    });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const sudokuJigsawGenerators: GeneratorVersions<Content> = {
  1: generateV1(jigsawLayout),
};

export const sudokuRainbowGenerators: GeneratorVersions<Content> = {
  1: generateV1(rainbowLayout),
};
