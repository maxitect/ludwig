import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import {
  type Layout,
  SIDES,
  STEP,
  countSolutions,
  countsOf,
  laidAlong,
} from "./engine";
import { gradeRailroad } from "./grade";
import type { Cell, Content, Placed, Side } from "./schema";

const MAX_CANDIDATES = 400;
const PATH_BUDGET = 4000;

/** A track with fewer bends than this share of its cells is mostly straight runs, and is rejected. */
export const MIN_BEND_SHARE = 0.4;

const sizesFor = (difficulty: Difficulty): ReadonlyArray<number> => {
  switch (difficulty) {
    case 1:
      return [4, 5];
    case 2:
      return [5, 6];
    case 3:
      return [6, 7, 8];
    case 4:
      return [7, 8, 9];
    case 5:
      return [8, 9, 10];
  }
};

function edgeCells(size: number) {
  const cells: { cell: Cell; side: Side }[] = [];
  for (let i = 0; i < size; i++) {
    cells.push({ cell: { row: 0, col: i }, side: "n" });
    cells.push({ cell: { row: size - 1, col: i }, side: "s" });
    cells.push({ cell: { row: i, col: 0 }, side: "w" });
    cells.push({ cell: { row: i, col: size - 1 }, side: "e" });
  }
  return cells;
}

/** A random self-avoiding walk from the entry cell to the exit cell of between `min` and `max` cells. */
function randomPath(
  rng: () => number,
  size: number,
  from: Cell,
  to: Cell,
  min: number,
  max: number,
) {
  const visited = new Set<number>();
  const path: Cell[] = [];
  let budget = PATH_BUDGET;
  const distance = (cell: Cell) =>
    Math.abs(cell.row - to.row) + Math.abs(cell.col - to.col);

  function walk(cell: Cell): boolean {
    if (budget-- <= 0) return false;
    path.push(cell);
    visited.add(cell.row * size + cell.col);
    if (cell.row === to.row && cell.col === to.col) {
      if (path.length >= min) return true;
    } else if (path.length + distance(cell) <= max) {
      for (const side of shuffle(rng, SIDES)) {
        const [dr, dc] = STEP[side];
        const next = { row: cell.row + dr, col: cell.col + dc };
        if (
          next.row < 0 ||
          next.row >= size ||
          next.col < 0 ||
          next.col >= size ||
          visited.has(next.row * size + next.col)
        ) {
          continue;
        }
        if (walk(next)) return true;
      }
    }
    path.pop();
    visited.delete(cell.row * size + cell.col);
    return false;
  }

  return walk(from) ? path : null;
}

const bends = (pieces: readonly Placed[]) =>
  pieces.filter(({ piece }) => piece !== "ns" && piece !== "ew").length;

/**
 * Reveals every piece, then takes them back in random order while the clues keep one track that
 * the grader finishes at or below the target.
 */
function reveal(
  rng: () => number,
  base: Omit<Layout, "given">,
  pieces: readonly Placed[],
  difficulty: Difficulty,
) {
  let given = [...pieces];
  for (const piece of shuffle(rng, pieces)) {
    const fewer = given.filter((other) => other !== piece);
    const layout = { ...base, given: fewer };
    if (countSolutions(layout) === 1 && gradeRailroad(layout, difficulty)) {
      given = fewer;
    }
  }
  return given;
}

/**
 * Version 1: a random self-avoiding track between two edge cells, its counts derived, then every
 * piece revealed and taken back while the clues keep one track that the technique grader finishes
 * at or below the target. A candidate is kept when the grader's hardest technique is the target.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const sizes = sizesFor(difficulty);
  return generateGraded<Content>(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const size = sizes[Math.floor(rng() * sizes.length)];
    const ends = edgeCells(size);
    const start = ends[Math.floor(rng() * ends.length)];
    const finish = ends[Math.floor(rng() * ends.length)];
    const apart =
      Math.abs(start.cell.row - finish.cell.row) +
      Math.abs(start.cell.col - finish.cell.col);
    if (apart < size - 1) return null;
    const min = Math.round(size * size * 0.3);
    const max = Math.round(size * size * 0.7);
    const path = randomPath(rng, size, start.cell, finish.cell, min, max);
    if (!path) return null;
    const entry = { ...start.cell, side: start.side };
    const exit = { ...finish.cell, side: finish.side };
    const pieces = laidAlong({ entry, exit }, path, entry.side);
    if (bends(pieces) < MIN_BEND_SHARE * pieces.length) return null;
    const base = {
      rows: size,
      cols: size,
      entry,
      exit,
      ...countsOf({ rows: size, cols: size }, path),
    };
    const given = reveal(rng, base, pieces, difficulty).toSorted(
      (a, b) => a.row - b.row || a.col - b.col,
    );
    const content = { ...base, given };
    const grade = gradeRailroad(content, difficulty);
    if (grade && countSolutions(content) !== 1) return null;
    return grade ? { content, difficulty: grade.difficulty } : null;
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const railroadGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
