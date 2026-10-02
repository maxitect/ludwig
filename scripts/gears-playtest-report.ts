import { type Diagram, lcmTeeth, stateAt } from "../src/puzzles/gears/engine";
import {
  diagramOf,
  generateDiagramWithAttempts,
} from "../src/puzzles/gears/generate";
import { type Difficulty, difficulties } from "../src/puzzles/gears/presets";

const SEEDS = 500;
const FIGURES = 8;

const THRESHOLDS = {
  nearMisses: 3,
  maxFigureShare: 0.25,
  maxCrankZeroShare: 0.05,
  churn: 1,
  acceptance: 0.02,
  meanMs: 50,
};

const mean = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

function seerIds(diagram: Diagram, crank: number, figure: number) {
  return Object.entries(stateAt(diagram, crank, figure))
    .filter(([, state]) => state.sees)
    .map(([id]) => id);
}

/** Cells (crank, figure) where exactly 0 or exactly 2 gears see the victim. */
function nearMisses(diagram: Diagram) {
  let count = 0;
  for (let crank = 0; crank < lcmTeeth(diagram.gears); crank++) {
    for (let figure = 1; figure <= FIGURES; figure++) {
      const seers = seerIds(diagram, crank, figure).length;
      if (seers === 0 || seers === 2) count++;
    }
  }
  return count;
}

/** Gears whose `sees` flips between consecutive convergences, averaged over the 7 steps at `crank`. */
function churn(diagram: Diagram, crank: number) {
  const flips: number[] = [];
  for (let figure = 1; figure < FIGURES; figure++) {
    const before = new Set(seerIds(diagram, crank, figure));
    const after = new Set(seerIds(diagram, crank, figure + 1));
    const changed = diagram.gears.filter(
      (g) => before.has(g.id) !== after.has(g.id),
    );
    flips.push(changed.length);
  }
  return mean(flips);
}

function evaluate(difficulty: Difficulty) {
  const misses: number[] = [];
  const churns: number[] = [];
  const times: number[] = [];
  const figureCounts = Array.from({ length: FIGURES }, () => 0);
  let crankZero = 0;
  let attempts = 0;
  for (let i = 0; i < SEEDS; i++) {
    const start = performance.now();
    const { content, attempts: used } = generateDiagramWithAttempts(
      `playtest-${i}`,
      difficulty,
    );
    times.push(performance.now() - start);
    attempts += used;
    const diagram = diagramOf(content);
    const { crank, convergence } = content.solution;
    misses.push(nearMisses(diagram));
    churns.push(churn(diagram, crank));
    figureCounts[convergence - 1]!++;
    if (crank === 0) crankZero++;
  }
  const shares = figureCounts.map((n) => n / SEEDS);
  return {
    difficulty,
    nearMisses: mean(misses),
    figureShares: shares,
    maxFigureShare: Math.max(...shares),
    crankZeroShare: crankZero / SEEDS,
    churn: mean(churns),
    acceptance: SEEDS / attempts,
    meanMs: mean(times),
  };
}

const rows = difficulties.map(evaluate);

const passes = (row: (typeof rows)[number]) => ({
  nearMisses: row.nearMisses >= THRESHOLDS.nearMisses,
  figureShare: row.maxFigureShare <= THRESHOLDS.maxFigureShare,
  crankZero: row.crankZeroShare < THRESHOLDS.maxCrankZeroShare,
  churn: row.churn >= THRESHOLDS.churn,
  acceptance: row.acceptance >= THRESHOLDS.acceptance,
  meanMs: row.meanMs < THRESHOLDS.meanMs,
});

console.log(`gears playtest report: ${SEEDS} seeds per preset\n`);
console.log(
  "preset  | near misses | max f share | c=0 share | churn | accept % | mean ms | verdict",
);
for (const row of rows) {
  const verdict = Object.values(passes(row)).every(Boolean) ? "PASS" : "FAIL";
  console.log(
    [
      row.difficulty.padEnd(7),
      row.nearMisses.toFixed(1).padStart(11),
      `${(row.maxFigureShare * 100).toFixed(1)}%`.padStart(11),
      `${(row.crankZeroShare * 100).toFixed(1)}%`.padStart(9),
      row.churn.toFixed(2).padStart(5),
      (row.acceptance * 100).toFixed(1).padStart(8),
      row.meanMs.toFixed(2).padStart(7),
      verdict,
    ].join(" | "),
  );
}
console.log("\nsolution convergence f share (f = 1..8)");
for (const row of rows) {
  console.log(
    `${row.difficulty.padEnd(7)} ${row.figureShares
      .map((s) => `${(s * 100).toFixed(1)}%`.padStart(6))
      .join(" ")}`,
  );
}

const failed = rows.flatMap((row) =>
  Object.entries(passes(row))
    .filter(([, ok]) => !ok)
    .map(([name]) => `${row.difficulty}: ${name}`),
);
if (failed.length) {
  console.error(`\nFAILED: ${failed.join(", ")}`);
  process.exit(1);
}
