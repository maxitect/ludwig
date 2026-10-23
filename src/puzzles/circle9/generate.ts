import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { randomSolvedGrid } from "../sudoku/generate";
import { boxOf, countSolutions, type Layout, SIZE } from "./engine";
import { gradeCircle9 } from "./grade";
import type { Content } from "./schema";

const MAX_CANDIDATES = 4000;
const CELLS = SIZE * SIZE;

/** One cell per row, column and box with a different digit each, read off a solved sudoku. */
function randomCircles(rng: () => number, grid: ReadonlyArray<number>) {
  const columns = new Set<number>();
  const boxes = new Set<number>();
  const digits = new Set<number>();
  const circled: number[] = [];
  const order = Array.from({ length: SIZE }, (_, i) => i);
  function place(row: number): boolean {
    if (row === SIZE) return true;
    for (const col of shuffle(rng, order)) {
      const index = row * SIZE + col;
      const digit = grid[index];
      if (columns.has(col) || boxes.has(boxOf(index)) || digits.has(digit)) {
        continue;
      }
      columns.add(col);
      boxes.add(boxOf(index));
      digits.add(digit);
      circled.push(index);
      if (place(row + 1)) return true;
      circled.pop();
      columns.delete(col);
      boxes.delete(boxOf(index));
      digits.delete(digit);
    }
    return false;
  }
  return place(0) ? circled : null;
}

function toContent(digits: ReadonlyArray<number>): Content {
  return {
    grid: Array.from({ length: SIZE }, (_, row) =>
      digits
        .slice(row * SIZE, (row + 1) * SIZE)
        .map((digit) => digit || ".")
        .join(""),
    ),
  };
}

/** Numbers on the grid, circled ones included: harder puzzles carry more decoys. */
const numbersFor = (difficulty: Difficulty) => 18 + 6 * difficulty;

/**
 * Version 1: a solved sudoku fixes the circled cells. Decoys with random digits are then tried
 * on the other cells in a shuffled order, each kept only while the circles stay the one solution
 * and the technique grader, held to the target difficulty, still solves the grid, until the grid
 * holds the difficulty's quota of numbers. A candidate is kept when it grades at the target.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const solved = randomSolvedGrid(rng);
    const circled = randomCircles(rng, solved);
    if (!circled) return null;
    const planted = new Set(circled);
    const digits = Array.from({ length: CELLS }, (_, index) =>
      planted.has(index) ? solved[index] : 0,
    );
    const layout: Layout = { digits };
    let count = SIZE;
    const target = numbersFor(difficulty);
    for (const index of shuffle(
      rng,
      digits.flatMap((digit, i) => (digit ? [] : [i])),
    )) {
      if (count === target) break;
      digits[index] = 1 + Math.floor(rng() * SIZE);
      if (
        countSolutions(layout) === 1 &&
        gradeCircle9(layout, difficulty)
      ) {
        count++;
      } else {
        digits[index] = 0;
      }
    }
    if (count !== target) return null;
    const grade = gradeCircle9(layout, difficulty);
    return grade ? { content: toContent(digits), difficulty: grade.difficulty } : null;
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const circle9Generators: GeneratorVersions<Content> = {
  1: generateV1,
};
