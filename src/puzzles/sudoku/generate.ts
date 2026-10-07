import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { countSolutions, type Grid, toSolution } from "./engine";
import { gradeSudoku } from "./grade";
import type { Content } from "./schema";

const SIZE = 9;
const CELLS = SIZE * SIZE;
const MAX_CANDIDATES = 3000;

const boxOf = (index: number) =>
  Math.floor(index / 27) * 3 + Math.floor((index % SIZE) / 3);

/** A random completed grid, filled cell by cell from shuffled digits with backtracking. */
function randomSolvedGrid(rng: () => number) {
  const grid: Grid = Array(CELLS).fill(0);
  const rows = Array<number>(SIZE).fill(0);
  const cols = Array<number>(SIZE).fill(0);
  const boxes = Array<number>(SIZE).fill(0);
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  function fill(index: number): boolean {
    if (index === CELLS) return true;
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const box = boxOf(index);
    for (const digit of shuffle(rng, digits)) {
      const mask = 1 << digit;
      if ((rows[row] | cols[col] | boxes[box]) & mask) continue;
      grid[index] = digit;
      rows[row] |= mask;
      cols[col] |= mask;
      boxes[box] |= mask;
      if (fill(index + 1)) return true;
      grid[index] = 0;
      rows[row] &= ~mask;
      cols[col] &= ~mask;
      boxes[box] &= ~mask;
    }
    return false;
  }

  fill(0);
  return grid;
}

function toContent(grid: Grid): Content {
  return {
    givens: toSolution(grid).filter(({ digit }) => digit !== 0),
  };
}

/**
 * Version 1: a random solved grid, then 180° symmetric pairs of givens removed in a shuffled order
 * while the technique grader, held to the target difficulty, still solves the puzzle. The result
 * is minimal under that limit, so the difficulty is met only when the last techniques needed
 * reach it; otherwise the candidate is rejected.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const grid = randomSolvedGrid(rng);
    let grade = gradeSudoku(grid, difficulty);
    if (!grade) return null;
    const order = shuffle(
      rng,
      Array.from({ length: Math.ceil(CELLS / 2) }, (_, index) => index),
    );
    for (const index of order) {
      const mirror = CELLS - 1 - index;
      const kept = [grid[index], grid[mirror]];
      grid[index] = 0;
      grid[mirror] = 0;
      const next = gradeSudoku(grid, difficulty);
      if (next) {
        grade = next;
      } else {
        grid[index] = kept[0];
        grid[mirror] = kept[1];
      }
    }
    const content = toContent(grid);
    if (countSolutions(content.givens, 2) !== 1) return null;
    return { content, difficulty: grade.difficulty };
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const sudokuGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
