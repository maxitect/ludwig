import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { countSolutions, type Grid, SYMBOLS } from "./engine";
import { solveTroix } from "./grade";
import type { Content } from "./schema";

const MAX_CANDIDATES = 400;

/** Small grids for the gentle puzzles, the large grid for the rest. */
const sizesFor = (difficulty: Difficulty): Content["size"][] => {
  switch (difficulty) {
    case 1:
      return [6];
    case 2:
      return [6, 9];
    default:
      return [9];
  }
};

/** A random filled grid: equal symbol counts per line, never three alike in a row. */
function randomFilledGrid(rng: () => number, size: number) {
  const quota = size / 3;
  const grid: Grid = Array(size * size).fill(0);
  const rows = Array.from({ length: size }, () => [0, 0, 0, 0]);
  const cols = Array.from({ length: size }, () => [0, 0, 0, 0]);

  function fill(index: number): boolean {
    if (index === size * size) return true;
    const row = Math.floor(index / size);
    const col = index % size;
    for (const code of shuffle(rng, [1, 2, 3])) {
      if (rows[row][code] >= quota || cols[col][code] >= quota) continue;
      if (col >= 2 && grid[index - 1] === code && grid[index - 2] === code)
        continue;
      if (
        row >= 2 &&
        grid[index - size] === code &&
        grid[index - 2 * size] === code
      ) {
        continue;
      }
      grid[index] = code;
      rows[row][code]++;
      cols[col][code]++;
      if (fill(index + 1)) return true;
      grid[index] = 0;
      rows[row][code]--;
      cols[col][code]--;
    }
    return false;
  }

  return fill(0) ? grid : null;
}

function toContent(
  size: Content["size"],
  grid: Grid,
  kept: ReadonlyArray<number>,
): Content {
  return {
    size,
    givens: [...kept]
      .sort((a, b) => a - b)
      .map((index) => ({
        row: Math.floor(index / size),
        col: index % size,
        symbol: SYMBOLS[grid[index] - 1],
      })),
  };
}

/**
 * Version 1: a random filled grid, then givens removed in a shuffled order while the technique
 * grader, held to the target difficulty, still solves the puzzle. The result is minimal under that
 * limit, so a candidate is kept only when the techniques it needs reach the target.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const sizes = sizesFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const size = sizes[Math.floor(rng() * sizes.length)];
    const grid = randomFilledGrid(rng, size);
    if (!grid) return null;
    let kept = grid.map((_, index) => index);
    for (const index of shuffle(rng, kept)) {
      const rest = kept.filter((other) => other !== index);
      if (solveTroix(toContent(size, grid, rest), difficulty)) kept = rest;
    }
    const content = toContent(size, grid, kept);
    const solved = solveTroix(content, difficulty);
    if (!solved || countSolutions(content, 2) !== 1) return null;
    return { content, difficulty: solved.grade.difficulty };
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const troixGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
