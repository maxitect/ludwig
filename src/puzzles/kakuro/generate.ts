import { cellKey } from "../_shared/cell-grid/navigation";
import { bitCount } from "../_shared/generate/candidates";
import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { deriveClues } from "./derive";
import { countSolutions } from "./engine";
import { solveKakuro } from "./grade";
import type { Content } from "./schema";

const MAX_CANDIDATES = 4000;
const REPAIR_STEPS = 400;

type Shape = { rows: number; cols: number };

/** Grid sizes (rows and columns, clue cells included), the longest run, and the weight of each digit in the fill. */
const settingsFor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 1:
      return {
        sizes: [6, 7],
        maxRun: 5,
        weights: [0, 5, 3, 1, 1, 1, 1, 1, 3, 5],
      };
    case 2:
      return {
        sizes: [7, 8],
        maxRun: 5,
        weights: [0, 4, 2, 1, 1, 1, 1, 1, 2, 4],
      };
    case 3:
      return {
        sizes: [8, 9],
        maxRun: 5,
        weights: [0, 3, 2, 1, 1, 1, 1, 1, 2, 3],
      };
    case 4:
      return {
        sizes: [9, 10],
        maxRun: 5,
        weights: [0, 2, 2, 1, 1, 1, 1, 1, 2, 2],
      };
    case 5:
      return {
        sizes: [10, 11],
        maxRun: 6,
        weights: [0, 2, 1, 1, 1, 1, 1, 1, 1, 2],
      };
  }
};

type Grid = boolean[][];

const runsOf = (grid: Grid, across: boolean) => {
  const found: number[][] = [];
  const lines = across ? grid.length : grid[0].length;
  const length = across ? grid[0].length : grid.length;
  for (let line = 0; line < lines; line++) {
    let run: number[] = [];
    for (let i = 0; i <= length; i++) {
      const row = across ? line : i;
      const col = across ? i : line;
      if (i < length && grid[row][col]) run.push(row * grid[0].length + col);
      else {
        if (run.length) found.push(run);
        run = [];
      }
    }
  }
  return found;
};

/** The white cells reachable from the first white cell. */
function reachable(grid: Grid) {
  const { length: rows } = grid;
  const cols = grid[0].length;
  const start = grid.flat().indexOf(true);
  const seen = new Set([start]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const row = Math.floor(queue[head] / cols);
    const col = queue[head] % cols;
    for (const [r, c] of [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ]) {
      const next = r * cols + c;
      if (
        r >= 0 &&
        r < rows &&
        c >= 0 &&
        c < cols &&
        grid[r][c] &&
        !seen.has(next)
      ) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

const hasSingle = (grid: Grid) =>
  [true, false].some((across) =>
    runsOf(grid, across).some((run) => run.length === 1),
  );

const isValid = (grid: Grid) =>
  !hasSingle(grid) &&
  reachable(grid).size === grid.flat().filter(Boolean).length;

/**
 * A random layout: the first row and column black and the rest white, long runs split where both
 * halves keep at least two cells, then black cells added in random order (each with probability
 * `density`) whenever no run becomes a single cell and the white cells stay in one piece. Null
 * when a run cannot be split.
 */
function layout(
  rng: () => number,
  { rows, cols }: Shape,
  maxRun: number,
  density: number,
) {
  const grid: Grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => r > 0 && c > 0),
  );
  const blacken = (at: number, keep: boolean) => {
    const [r, c] = [Math.floor(at / cols), at % cols];
    grid[r][c] = false;
    if (keep && isValid(grid)) return true;
    grid[r][c] = true;
    return false;
  };
  for (;;) {
    const long = [true, false]
      .flatMap((across) => runsOf(grid, across))
      .filter((run) => run.length > maxRun);
    if (!long.length) break;
    const split = shuffle(rng, long).some((run) =>
      shuffle(rng, run).some((at) => blacken(at, true)),
    );
    if (!split) return null;
  }
  const interior = Array.from({ length: rows * cols }, (_, at) => at).filter(
    (at) =>
      at % cols > 0 && at >= cols && grid[Math.floor(at / cols)][at % cols],
  );
  for (const at of shuffle(rng, interior)) {
    if (rng() < density) blacken(at, true);
  }
  return isValid(grid) ? grid : null;
}

type Fill = { row: number; col: number; digit: number }[];

/** A random fill with no repeat in a run, digits drawn by weight. */
function fill(
  rng: () => number,
  grid: Grid,
  weights: ReadonlyArray<number>,
): Fill {
  const cols = grid[0].length;
  const digits = new Map<number, number>();
  const cells = grid.flatMap((line, r) =>
    line.flatMap((white, c) => (white ? [r * cols + c] : [])),
  );
  for (const at of cells) {
    const taken = new Set<number>();
    for (const step of [1, cols]) {
      for (let back = at - step; digits.has(back); back -= step) {
        taken.add(digits.get(back)!);
      }
    }
    const options = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !taken.has(d));
    const total = options.reduce((sum, d) => sum + weights[d], 0);
    let pick = rng() * total;
    digits.set(at, options.find((d) => (pick -= weights[d]) < 0) ?? options[0]);
  }
  return cells.map((at) => ({
    row: Math.floor(at / cols),
    col: at % cols,
    digit: digits.get(at)!,
  }));
}

const solve = (cells: Fill, maxLevel: Difficulty) =>
  solveKakuro({ cells, clues: deriveClues(cells) }, maxLevel);

type Solved = ReturnType<typeof solve>;

/** How far a fill is from the target: unsolved grids by what the techniques left open, solved ones by how easy they are. */
function distance(
  { grade, digits, candidates }: Solved,
  difficulty: Difficulty,
) {
  if (grade) return difficulty - grade.difficulty;
  return (
    10 +
    digits.reduce(
      (total, placed, index) =>
        total + (placed ? 0 : 1 + bitCount(candidates[index]) / 10),
      0,
    )
  );
}

/**
 * Repair: change one digit at a time, keeping every run free of repeats, and keep the change
 * unless it moves further from a grid the techniques up to the target difficulty solve with the
 * target as the hardest one needed.
 */
function repair(rng: () => number, start: Fill, difficulty: Difficulty) {
  let cells = start;
  let current = solve(cells, difficulty);
  for (let step = 0; step < REPAIR_STEPS; step++) {
    if (current.grade?.difficulty === difficulty) {
      return { cells, grade: current.grade };
    }
    const stuck = current.digits.flatMap((placed, i) => (placed ? [] : [i]));
    const at =
      stuck.length && rng() < 0.7
        ? stuck[Math.floor(rng() * stuck.length)]
        : Math.floor(rng() * cells.length);
    const value = 1 + Math.floor(rng() * 9);
    const target = cells[at];
    if (target.digit === value) continue;
    const clash = cells.some(
      (cell) =>
        cell !== target &&
        cell.digit === value &&
        (cell.row === target.row || cell.col === target.col) &&
        sameRun(cells, cell, target),
    );
    if (clash) continue;
    const next = cells.map((cell, i) =>
      i === at ? { ...cell, digit: value } : cell,
    );
    const solved = solve(next, difficulty);
    if (distance(solved, difficulty) <= distance(current, difficulty)) {
      cells = next;
      current = solved;
    }
  }
  return current.grade?.difficulty === difficulty
    ? { cells, grade: current.grade }
    : null;
}

function sameRun(
  cells: Fill,
  a: { row: number; col: number },
  b: { row: number; col: number },
) {
  const white = new Set(cells.map(({ row, col }) => cellKey(row, col)));
  const across = a.row === b.row;
  const [low, high] = across
    ? [Math.min(a.col, b.col), Math.max(a.col, b.col)]
    : [Math.min(a.row, b.row), Math.max(a.row, b.row)];
  for (let i = low; i <= high; i++) {
    if (!white.has(across ? cellKey(a.row, i) : cellKey(i, a.col)))
      return false;
  }
  return true;
}

/**
 * Version 1: a random black-cell layout (first row and column black, runs of 2 to a per-difficulty
 * maximum, white cells in one piece), a weighted digit fill with no repeat in a run, then repair
 * by changing single digits until the techniques up to the target difficulty solve the clues.
 * A grid the techniques solve has one solution, so the exact count runs only on the kept puzzle.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const { sizes, maxRun, weights } = settingsFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const rows = sizes[Math.floor(rng() * sizes.length)];
    const cols = sizes[Math.floor(rng() * sizes.length)];
    const grid = layout(rng, { rows, cols }, maxRun, 0.2 + rng() * 0.1);
    if (!grid) return null;
    const repaired = repair(rng, fill(rng, grid, weights), difficulty);
    if (!repaired) return null;
    const content: Content = { rows, cols, cells: repaired.cells };
    if (
      countSolutions({
        cells: content.cells,
        clues: deriveClues(content.cells),
      }) !== 1
    ) {
      return null;
    }
    return { content, difficulty: repaired.grade.difficulty };
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const kakuroGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
