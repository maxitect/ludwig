import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { countSolutions, type Grid } from "./engine";
import { gradeFutoshiki } from "./grade";
import type { Content, Inequality } from "./schema";

const MAX_CANDIDATES = 3000;

const sizeFor = (difficulty: Difficulty) => (difficulty <= 2 ? 5 : difficulty <= 4 ? 6 : 7);

/** A random Latin square, filled cell by cell from shuffled digits with backtracking. */
function randomLatinSquare(rng: () => number, size: number) {
  const grid: Grid = Array(size * size).fill(0);
  const rows = Array<number>(size).fill(0);
  const cols = Array<number>(size).fill(0);
  const digits = Array.from({ length: size }, (_, index) => index + 1);

  function fill(index: number): boolean {
    if (index === size * size) return true;
    const row = Math.floor(index / size);
    const col = index % size;
    for (const digit of shuffle(rng, digits)) {
      const mask = 1 << digit;
      if ((rows[row] | cols[col]) & mask) continue;
      grid[index] = digit;
      rows[row] |= mask;
      cols[col] |= mask;
      if (fill(index + 1)) return true;
      grid[index] = 0;
      rows[row] &= ~mask;
      cols[col] &= ~mask;
    }
    return false;
  }

  fill(0);
  return grid;
}

type Clue =
  | { kind: "given"; index: number }
  | { kind: "sign"; sign: Inequality };

function toContent(size: number, grid: Grid, clues: ReadonlyArray<Clue>): Content {
  const givens = clues
    .filter((clue) => clue.kind === "given")
    .map(({ index }) => ({
      row: Math.floor(index / size),
      col: index % size,
      digit: grid[index],
    }))
    .sort((a, b) => a.row - b.row || a.col - b.col);
  const inequalities = clues
    .filter((clue) => clue.kind === "sign")
    .map(({ sign }) => sign)
    .sort(
      (a, b) =>
        a.row - b.row ||
        a.col - b.col ||
        a.direction.localeCompare(b.direction),
    );
  return { size, givens, inequalities };
}

/**
 * Version 1: a random Latin square with every sign and every cell given, then clues removed in a
 * shuffled order while the technique grader, held to the target difficulty, still solves the
 * puzzle. The result is minimal under that limit, so a candidate is rejected unless the last
 * techniques needed reach the target.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const size = sizeFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const grid = randomLatinSquare(rng, size);
    const clues: Clue[] = grid.map((_, index) => ({ kind: "given", index }));
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const index = row * size + col;
        if (col + 1 < size) {
          clues.push({
            kind: "sign",
            sign: {
              row,
              col,
              direction: "right",
              relation: grid[index] < grid[index + 1] ? "lt" : "gt",
            },
          });
        }
        if (row + 1 < size) {
          clues.push({
            kind: "sign",
            sign: {
              row,
              col,
              direction: "down",
              relation: grid[index] < grid[index + size] ? "lt" : "gt",
            },
          });
        }
      }
    }

    let kept = clues;
    let grade = gradeFutoshiki(toContent(size, grid, kept), difficulty);
    if (!grade) return null;
    for (const clue of shuffle(rng, clues)) {
      const rest = kept.filter((other) => other !== clue);
      const next = gradeFutoshiki(toContent(size, grid, rest), difficulty);
      if (next) {
        kept = rest;
        grade = next;
      }
    }
    const content = toContent(size, grid, kept);
    if (countSolutions(content, 2) !== 1) return null;
    return { content, difficulty: grade.difficulty };
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const futoshikiGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
