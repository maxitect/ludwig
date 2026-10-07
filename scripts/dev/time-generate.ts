import { readdirSync } from "node:fs";
import { hashSeed, mulberry32 } from "../../src/puzzles/_shared/prng";
import { countSolutions as countFutoshiki } from "../../src/puzzles/futoshiki/engine";
import { generateDiagram } from "../../src/puzzles/gears/generate";
import { difficulties } from "../../src/puzzles/gears/presets";
import { generateScene } from "../../src/puzzles/spot-difference/engine";
import {
  countSolutions as countSudoku,
  enumerateSolutions,
} from "../../src/puzzles/sudoku/engine";

/**
 * Research measurements for T099. These are throwaway prototypes, not the T100 generators:
 * gear and scene generation times, and a clue-removal loop for sudoku and futoshiki
 * graded by a singles-only propagation solver.
 */

const N = Number(process.argv[2] ?? 50);

function stats(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  return `median ${sorted[Math.floor(sorted.length / 2)].toFixed(1)} ms, worst ${sorted[sorted.length - 1].toFixed(1)} ms`;
}

function timeOf(fn: () => void) {
  const started = performance.now();
  fn();
  return performance.now() - started;
}

function shuffle<T>(items: T[], rand: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

for (const difficulty of difficulties) {
  const times = Array.from({ length: Math.min(N, 20) }, (_, i) =>
    timeOf(() => generateDiagram(`bench-${i}`, difficulty)),
  );
  console.log(`gears ${difficulty}: ${stats(times)} (${times.length} seeds)`);
}
console.log(
  `spot-difference (8 differences): ${stats(Array.from({ length: N }, (_, i) => timeOf(() => generateScene(i, 8, 1))))} (${N} seeds)`,
);

const peersOf = (i: number) => {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const set = new Set<number>();
  for (let k = 0; k < 9; k++) {
    set.add(r * 9 + k);
    set.add(k * 9 + c);
  }
  const br = r - (r % 3);
  const bc = c - (c % 3);
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++) set.add((br + a) * 9 + bc + b);
  set.delete(i);
  return [...set];
};
const PEERS = Array.from({ length: 81 }, (_, i) => peersOf(i));
const UNITS: number[][] = [];
for (let k = 0; k < 9; k++) {
  UNITS.push(Array.from({ length: 9 }, (_, j) => k * 9 + j));
  UNITS.push(Array.from({ length: 9 }, (_, j) => j * 9 + k));
  const br = Math.floor(k / 3) * 3;
  const bc = (k % 3) * 3;
  UNITS.push(
    Array.from(
      { length: 9 },
      (_, j) => (br + Math.floor(j / 3)) * 9 + bc + (j % 3),
    ),
  );
}

/** Solves with naked and hidden singles only. Returns how many cells stay empty. */
function singlesOnly(grid: number[]) {
  const g = [...grid];
  const cand = g.map((d) => (d ? 0 : 0x3fe));
  const place = (i: number, d: number) => {
    g[i] = d;
    cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~(1 << d);
  };
  g.forEach((d, i) => {
    if (d) for (const p of PEERS[i]) cand[p] &= ~(1 << d);
  });
  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < 81; i++) {
      if (!g[i] && cand[i] && (cand[i] & (cand[i] - 1)) === 0) {
        place(i, 31 - Math.clz32(cand[i]));
        progress = true;
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        if (unit.some((i) => g[i] === d)) continue;
        const spots = unit.filter((i) => !g[i] && cand[i] & (1 << d));
        if (spots.length === 1) {
          place(spots[0], d);
          progress = true;
        }
      }
    }
  }
  return g.filter((d) => !d).length;
}

function sudokuTrial(seed: number, symmetric: boolean) {
  const rand = mulberry32(hashSeed(`sudoku-bench-${seed}`));
  const first = new Array<number>(81).fill(0);
  shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand).forEach((d, i) => {
    first[i] = d;
  });
  const full = enumerateSolutions(first, 1)[0];
  const started = performance.now();
  const givens = new Set(full.keys());
  for (const i of shuffle([...Array(81).keys()], rand)) {
    if (!givens.has(i)) continue;
    const drop = symmetric ? [i, 80 - i] : [i];
    const trial = new Set(givens);
    for (const d of drop) trial.delete(d);
    const list = [...trial].map((k) => ({
      row: Math.floor(k / 9),
      col: k % 9,
      digit: full[k],
    }));
    if (countSudoku(list, 2) === 1) for (const d of drop) givens.delete(d);
  }
  const puzzle = full.map((d, i) => (givens.has(i) ? d : 0));
  return {
    clues: givens.size,
    ms: performance.now() - started,
    singles: singlesOnly(puzzle) === 0,
  };
}

for (const symmetric of [false, true]) {
  const runs = Array.from({ length: N }, (_, i) => sudokuTrial(i, symmetric));
  const clues = runs.map((r) => r.clues).sort((a, b) => a - b);
  console.log(
    `sudoku minimal puzzles, ${symmetric ? "180-degree symmetric" : "no symmetry"}: ${stats(runs.map((r) => r.ms))}; clues ${clues[0]}-${clues[clues.length - 1]} (median ${clues[Math.floor(N / 2)]}); solvable by singles alone ${runs.filter((r) => r.singles).length}/${N}`,
  );
}

function latinSquare(rand: () => number) {
  const size = 5;
  const perm = shuffle([1, 2, 3, 4, 5], rand);
  const rowOrder = shuffle([0, 1, 2, 3, 4], rand);
  const colOrder = shuffle([0, 1, 2, 3, 4], rand);
  return rowOrder.flatMap((r) => colOrder.map((c) => perm[(r + c) % size]));
}

type Sign = {
  row: number;
  col: number;
  direction: "right" | "down";
  relation: "lt" | "gt";
};

function futoshikiTrial(seed: number) {
  const rand = mulberry32(hashSeed(`futoshiki-bench-${seed}`));
  const size = 5;
  const grid = latinSquare(rand);
  const started = performance.now();
  let signs: Sign[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const here = grid[r * size + c];
      if (c + 1 < size)
        signs.push({
          row: r,
          col: c,
          direction: "right",
          relation: here < grid[r * size + c + 1] ? "lt" : "gt",
        });
      if (r + 1 < size)
        signs.push({
          row: r,
          col: c,
          direction: "down",
          relation: here < grid[(r + 1) * size + c] ? "lt" : "gt",
        });
    }
  }
  const unique = () =>
    countFutoshiki({ size, givens: [], inequalities: signs }, 2) === 1;
  const startSigns = signs.length;
  const fullIsUnique = unique();
  for (const s of shuffle([...signs], rand)) {
    const before = signs;
    signs = signs.filter((x) => x !== s);
    if (!unique()) signs = before;
  }
  return {
    startSigns,
    fullIsUnique,
    signs: signs.length,
    ms: performance.now() - started,
    valid: unique(),
  };
}

const fut = Array.from({ length: N }, (_, i) => futoshikiTrial(i));
console.log(
  `futoshiki 5x5, remove signs from the full set while unique, no givens: ${stats(fut.map((r) => r.ms))}; full set unique ${fut.filter((r) => r.fullIsUnique).length}/${N}; signs left median ${fut.map((r) => r.signs).sort((a, b) => a - b)[Math.floor(N / 2)]}; reduced puzzle unique ${fut.filter((r) => r.valid).length}/${N}`,
);

async function reportContent() {
  for (const name of readdirSync("content/sudoku").sort()) {
    const { meta, content } = await import(`../../content/sudoku/${name}`);
    const grid = new Array<number>(81).fill(0);
    for (const { row, col, digit } of content.givens) grid[row * 9 + col] = digit;
    console.log(
      `content/sudoku/${name}: difficulty ${meta.difficulty}, ${content.givens.length} givens, empty cells left after singles only: ${singlesOnly(grid)}`,
    );
  }
}

reportContent();
