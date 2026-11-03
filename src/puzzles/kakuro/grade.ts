import { cellKey } from "../_shared/cell-grid/navigation";
import {
  bit,
  type CandidateState,
  createState,
  digitsOf,
  eliminate,
  gradeByTechnique,
  nakedSingle,
  place,
  nakedSubset,
  type Technique,
} from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import { clueRun, deriveClues, runCells } from "./derive";
import { combinations } from "./engine";
import type { Content, Payload } from "./schema";

type Run = { cells: number[]; sum: number };

const DIGITS = 0b1111111110;

const maskOf = (digits: ReadonlyArray<number>) =>
  digits.reduce((mask, digit) => mask | bit(digit), 0);

const comboCache = new Map<number, ReadonlyArray<number>>();

function comboMasks(length: number, sum: number) {
  const key = length * 46 + sum;
  let masks = comboCache.get(key);
  if (!masks) {
    masks = combinations(length, sum).map(maskOf);
    comboCache.set(key, masks);
  }
  return masks;
}

const openIn = (state: CandidateState, cells: ReadonlyArray<number>) =>
  cells.filter((index) => !state.grid[index]);

const usedIn = (state: CandidateState, cells: ReadonlyArray<number>) =>
  cells.reduce((mask, index) => mask | bit(state.grid[index]), 0) & ~1;

/**
 * Whether each digit of `left` can go in a cell of its own among the open cells of a run from
 * position `at` on, given their candidates (`options`; a pinned cell holds only its one digit).
 */
function assignable(
  options: ReadonlyArray<number>,
  at: number,
  left: number,
): boolean {
  if (at === options.length) return left === 0;
  for (let rest = options[at] & left; rest; rest &= rest - 1) {
    if (assignable(options, at + 1, left & ~(rest & -rest))) return true;
  }
  return false;
}

/**
 * Narrows every open cell of each run to the digits of the combinations for the run's sum that
 * still hold the digits already placed in it. `fits` drops a combination whose remaining digits
 * the open cells cannot take.
 */
function restrictRuns(
  runs: ReadonlyArray<Run>,
  fits: (state: CandidateState, rest: number, open: number[]) => boolean,
) {
  return (state: CandidateState) => {
    let progress = false;
    for (const run of runs) {
      const open = openIn(state, run.cells);
      if (!open.length) continue;
      const used = usedIn(state, run.cells);
      let allowed = 0;
      for (const combo of comboMasks(run.cells.length, run.sum)) {
        const rest = combo & ~used;
        if ((combo & used) === used && fits(state, rest, open)) allowed |= rest;
      }
      for (const index of open) {
        progress = eliminate(state, index, ~allowed) || progress;
      }
    }
    return progress;
  };
}

/** Each digit of the combination is possible in some open cell, and each open cell can take one of them. */
const reachable = (state: CandidateState, rest: number, open: number[]) => {
  const union = open.reduce((mask, index) => mask | state.cand[index], 0);
  return (
    (rest & union) === rest && open.every((index) => state.cand[index] & rest)
  );
};

/** The digits every combination still open to a run holds, so the run must contain them. */
function requiredDigits(state: CandidateState, run: Run, open: number[]) {
  const used = usedIn(state, run.cells);
  let required = DIGITS;
  for (const combo of comboMasks(run.cells.length, run.sum)) {
    const rest = combo & ~used;
    if ((combo & used) === used && reachable(state, rest, open)) {
      required &= rest;
    }
  }
  return required;
}

const spotsOf = (state: CandidateState, open: number[], digit: number) =>
  open.filter((index) => state.cand[index] & bit(digit));

/** A digit its run must hold that only one open cell can take goes there. */
function hiddenSingles(runs: ReadonlyArray<Run>) {
  return (state: CandidateState) => {
    for (const run of runs) {
      const open = openIn(state, run.cells);
      for (const digit of digitsOf(requiredDigits(state, run, open))) {
        const spots = spotsOf(state, open, digit);
        if (spots.length === 1) {
          place(state, spots[0], digit);
          return true;
        }
      }
    }
    return false;
  };
}

/** Two digits its run must hold that fit the same two open cells leave those cells nothing else. */
function hiddenPairs(runs: ReadonlyArray<Run>) {
  return (state: CandidateState) => {
    let progress = false;
    for (const run of runs) {
      const open = openIn(state, run.cells);
      const digits = digitsOf(requiredDigits(state, run, open));
      for (const [i, first] of digits.entries()) {
        for (const second of digits.slice(i + 1)) {
          const spots = new Set([
            ...spotsOf(state, open, first),
            ...spotsOf(state, open, second),
          ]);
          if (spots.size !== 2) continue;
          for (const index of spots) {
            progress =
              eliminate(
                state,
                index,
                state.cand[index] & ~(bit(first) | bit(second)),
              ) || progress;
          }
        }
      }
    }
    return progress;
  };
}

/** A digit stays in a cell only if a combination for the run places it there with all its other digits placed too. */
function runConsistency(runs: ReadonlyArray<Run>) {
  return (state: CandidateState) => {
    let progress = false;
    for (const run of runs) {
      const open = openIn(state, run.cells);
      if (open.length < 2) continue;
      const used = usedIn(state, run.cells);
      const combos = comboMasks(run.cells.length, run.sum).filter(
        (combo) => (combo & used) === used,
      );
      const options = open.map((index) => state.cand[index]);
      for (const [at, index] of open.entries()) {
        let keep = 0;
        for (const digit of digitsOf(state.cand[index])) {
          options[at] = bit(digit);
          const supported = combos.some((combo) => {
            const rest = combo & ~used;
            return rest & bit(digit) && assignable(options, 0, rest);
          });
          if (supported) keep |= bit(digit);
        }
        progress = eliminate(state, index, ~keep) || progress;
        options[at] = state.cand[index];
      }
    }
    return progress;
  };
}

/**
 * The ladder, by how much a solver has to hold in mind: the combination table with the digits
 * already placed, then the same table checked against the cells' pencil marks (run
 * intersections), hidden singles, implicit pairs, and last a run checked combination by
 * combination against every cell.
 */
function ladderFor(runs: ReadonlyArray<Run>): ReadonlyArray<Technique> {
  return [
    nakedSingle,
    {
      name: "combination table",
      level: 1,
      apply: restrictRuns(runs, () => true),
    },
    {
      name: "run intersection",
      level: 2,
      apply: restrictRuns(runs, reachable),
    },
    { name: "hidden single", level: 3, apply: hiddenSingles(runs) },
    nakedSubset("implicit pair", 2, 4),
    { name: "hidden pair", level: 4, apply: hiddenPairs(runs) },
    { name: "run consistency", level: 5, apply: runConsistency(runs) },
  ];
}

/** The white cells and clues a grader reads: never the digits. */
export type KakuroClues = Pick<Payload, "cells" | "clues">;

/**
 * Solves a kakuro from its clues by technique alone, easiest first. The grade is null when the
 * techniques up to `maxLevel` cannot fill every cell, which is what a puzzle that needs trial and
 * error looks like. `digits` holds what was placed, 0 for a cell left open, and `candidates` the digits still
 * possible in each.
 */
export function solveKakuro(
  { cells, clues }: KakuroClues,
  maxLevel: Difficulty = 5,
) {
  const index = new Map(cells.map(({ row, col }, i) => [cellKey(row, col), i]));
  const runs: Run[] = clues.map((clue) => ({
    cells: runCells(clueRun(clue)).map(
      ({ row, col }) => index.get(cellKey(row, col)) ?? -1,
    ),
    sum: clue.sum,
  }));
  const state = createState(
    Array<number>(cells.length).fill(0),
    9,
    runs.map((run) => run.cells),
  );
  const grade = gradeByTechnique(state, ladderFor(runs), maxLevel);
  return { grade, digits: state.grid, candidates: state.cand };
}

export const gradeKakuro = (
  { cells }: Pick<Content, "cells">,
  maxLevel: Difficulty = 5,
) => solveKakuro({ cells, clues: deriveClues(cells) }, maxLevel).grade;
