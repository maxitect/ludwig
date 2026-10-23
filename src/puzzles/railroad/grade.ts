import type { Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import type { Layout } from "./engine";
import {
  type State,
  type Technique,
  UNKNOWN,
  YES,
  NO,
  basic,
  copy,
  edgesOf,
  isSolved,
  markCell,
  markEdge,
  markOff,
  piecesOf,
  propagate,
  stateFor,
} from "./propagate";

/** Tries each undecided cell (and, when `edges`, edge) both ways; a way that breaks a rule settles it the other way. */
function contradiction(
  name: string,
  level: Difficulty,
  propagateTo: Difficulty,
  edges: boolean,
): Technique {
  const tryIt = (state: State, set: (s: State) => void) => {
    const trial = copy(state);
    set(trial);
    return !propagate(trial, propagateTo);
  };
  return {
    name,
    level,
    apply(state) {
      let progress = false;
      for (let cell = 0; cell < state.cells.length; cell++) {
        if (state.bad || state.cells[cell] !== UNKNOWN) continue;
        if (tryIt(state, (s) => markCell(s, cell, YES))) {
          progress = markOff(state, cell) || progress;
        } else if (tryIt(state, (s) => markOff(s, cell))) {
          progress = markCell(state, cell, YES) || progress;
        }
      }
      if (!edges) return progress;
      for (let cell = 0; cell < state.cells.length; cell++) {
        for (const side of edgesOf(state, cell, UNKNOWN)) {
          if (state.bad) return progress;
          if (tryIt(state, (s) => markEdge(s, cell, side, YES))) {
            progress = markEdge(state, cell, side, NO) || progress;
          } else if (tryIt(state, (s) => markEdge(s, cell, side, NO))) {
            progress = markEdge(state, cell, side, YES) || progress;
          }
        }
      }
      return progress;
    },
  };
}

const ladder: ReadonlyArray<Technique> = [
  ...basic,
  contradiction("contradiction on a cell", 4, 2, false),
  contradiction("contradiction on a cell or piece", 5, 3, true),
];

/** Applies every technique up to `maxLevel` until none draws a conclusion. False when the state breaks a rule. */
export function deduce(state: State, maxLevel: Difficulty) {
  let again = true;
  while (again && !state.bad) {
    again = false;
    for (const technique of ladder) {
      if (technique.level <= maxLevel && technique.apply(state)) again = true;
    }
  }
  return !state.bad;
}

/**
 * Grades a railroad by technique alone, easiest first: null when the techniques up to `maxLevel`
 * cannot decide every cell and piece, which is what a puzzle that needs trial and error looks
 * like. Also returns the track it found.
 */
export function solveRailroad(layout: Layout, maxLevel: Difficulty = 5) {
  const state = stateFor(layout);
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  while (!isSolved(state)) {
    if (state.bad) return null;
    const next = ladder.find(
      (technique) => technique.level <= maxLevel && technique.apply(state),
    );
    if (!next) return null;
    uses[next.name] = (uses[next.name] ?? 0) + 1;
    if (next.level > hardest.level) hardest = next;
  }
  if (state.bad) return null;
  const grade: Grade = {
    difficulty: hardest.level,
    hardest: hardest.name,
    uses,
  };
  return { grade, pieces: piecesOf(state) };
}

export const gradeRailroad = (layout: Layout, maxLevel: Difficulty = 5) =>
  solveRailroad(layout, maxLevel)?.grade ?? null;
