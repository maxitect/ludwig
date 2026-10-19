import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import {
  classicUnits,
  countSolutions,
  type Grid,
  toSolution,
  variantFor,
} from "./engine";
import { randomSolvedGrid } from "./generate";
import { gradeSudoku } from "./grade";
import type { Cage, Content, Xv } from "./schema";

const SIZE = 9;
const CELLS = SIZE * SIZE;
const MAX_CANDIDATES = 4000;
const MAX_MERGED_CELLS = 6;
const MERGE_ATTEMPTS = 40;

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

const allCells = Array.from({ length: CELLS }, (_, cell) => cell);

/** Edge-connected groups of cells that repeat no digit, each at most `maxSize` cells, grown from shuffled starting cells. */
function drawCages(solution: Grid, rng: () => number, maxSize: number) {
  const cageOf = Array<number>(CELLS).fill(-1);
  const cages: number[][] = [];
  for (const start of shuffle(rng, allCells)) {
    if (cageOf[start] !== -1) continue;
    const cage = [start];
    cageOf[start] = cages.length;
    const size = 1 + Math.floor(rng() * maxSize);
    while (cage.length < size) {
      const options = cage.flatMap((cell) =>
        neighbours(cell).filter(
          (next) =>
            cageOf[next] === -1 &&
            !cage.some((member) => solution[member] === solution[next]),
        ),
      );
      if (!options.length) break;
      const next = options[Math.floor(rng() * options.length)];
      cage.push(next);
      cageOf[next] = cages.length;
    }
    cages.push(cage);
  }
  return cages;
}

const toCages = (solution: Grid, groups: ReadonlyArray<ReadonlyArray<number>>) =>
  groups
    .map((cells) => [...cells].sort((a, b) => a - b))
    .sort((a, b) => a[0] - b[0])
    .map((cells): Cage => ({
      sum: cells.reduce((sum, cell) => sum + solution[cell], 0),
      cells: cells.map((cell) => ({
        row: Math.floor(cell / SIZE),
        col: cell % SIZE,
      })),
    }));

const touching = (
  first: ReadonlyArray<number>,
  second: ReadonlyArray<number>,
) =>
  first.some((cell) => neighbours(cell).some((next) => second.includes(next)));

/** Cage size ceiling by difficulty: small cages give away more, so easy puzzles keep them small. */
const maxCageSize = (difficulty: Difficulty) => (difficulty <= 2 ? 3 : 5);

/**
 * Version 1 of killer: a random solved grid cut into edge-connected cages that repeat no digit,
 * each with its sum. Givens come out one at a time in a shuffled order, then neighbouring cages
 * merge in a shuffled order, each only while the technique grader, held to the target difficulty,
 * still solves the puzzle. A killer may end with no givens.
 */
function generateKillerV1(seed: string, difficulty: Difficulty) {
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const solution = randomSolvedGrid(rng);
    const grid: Grid = [...solution];
    let groups = drawCages(solution, rng, maxCageSize(difficulty));
    const variantOf = (shape: ReadonlyArray<ReadonlyArray<number>>) =>
      variantFor({ cages: toCages(solution, shape) });
    let grade = gradeSudoku(grid, difficulty, classicUnits, variantOf(groups));
    if (!grade) return null;

    for (const index of shuffle(rng, allCells)) {
      grid[index] = 0;
      const next = gradeSudoku(grid, difficulty, classicUnits, variantOf(groups));
      if (next) {
        grade = next;
      } else {
        grid[index] = solution[index];
      }
    }

    const pairs = shuffle(
      rng,
      groups.flatMap((first, i) =>
        groups.slice(i + 1).flatMap((second) =>
          touching(first, second) &&
          first.length + second.length <= MAX_MERGED_CELLS &&
          new Set([...first, ...second].map((cell) => solution[cell])).size ===
            first.length + second.length
            ? [[first, second]]
            : [],
        ),
      ),
    ).slice(0, MERGE_ATTEMPTS);
    for (const [first, second] of pairs) {
      if (!groups.includes(first) || !groups.includes(second)) continue;
      const merged = [
        ...groups.filter((group) => group !== first && group !== second),
        [...first, ...second],
      ];
      const next = gradeSudoku(grid, difficulty, classicUnits, variantOf(merged));
      if (next) {
        groups = merged;
        grade = next;
      }
    }

    const content: Content = {
      givens: toSolution(grid).filter(({ digit }) => digit !== 0),
      cages: toCages(solution, groups),
    };
    if (
      countSolutions(
        content.givens,
        2,
        classicUnits,
        variantFor({ cages: content.cages }),
      ) !== 1
    ) {
      return null;
    }
    return { content, difficulty: grade.difficulty };
  });
}

/** An X for a pair that makes 10 and a V for one that makes 5, between each cell and its right and lower neighbours. */
function marksOf(solution: Grid): Xv {
  const marks: Xv["marks"] = [];
  for (let index = 0; index < CELLS; index++) {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const sides = [
      { direction: "right" as const, next: col < SIZE - 1 ? index + 1 : -1 },
      { direction: "down" as const, next: row < SIZE - 1 ? index + SIZE : -1 },
    ];
    for (const { direction, next } of sides) {
      if (next === -1) continue;
      const total = solution[index] + solution[next];
      if (total === 10 || total === 5) {
        marks.push({ row, col, direction, mark: total === 10 ? "x" : "v" });
      }
    }
  }
  return { marks };
}

/**
 * Version 1 of XV: a random solved grid, every adjacent pair that makes 10 or 5 marked, so the
 * negative rule holds for the rest. A mark cannot be dropped, since an unmarked pair would then be
 * forbidden to make its sum; givens come out one at a time in a shuffled order while the technique
 * grader, held to the target difficulty, still solves the puzzle.
 */
function generateXvV1(seed: string, difficulty: Difficulty) {
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const solution = randomSolvedGrid(rng);
    const grid: Grid = [...solution];
    const xv = marksOf(solution);
    const variant = variantFor({ xv });
    let grade = gradeSudoku(grid, difficulty, classicUnits, variant);
    if (!grade) return null;
    for (const index of shuffle(rng, allCells)) {
      grid[index] = 0;
      const next = gradeSudoku(grid, difficulty, classicUnits, variant);
      if (next) {
        grade = next;
      } else {
        grid[index] = solution[index];
      }
    }
    const content: Content = {
      givens: toSolution(grid).filter(({ digit }) => digit !== 0),
      xv,
    };
    if (countSolutions(content.givens, 2, classicUnits, variant) !== 1) {
      return null;
    }
    return { content, difficulty: grade.difficulty };
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const sudokuKillerGenerators: GeneratorVersions<Content> = {
  1: generateKillerV1,
};

export const sudokuXvGenerators: GeneratorVersions<Content> = {
  1: generateXvV1,
};
