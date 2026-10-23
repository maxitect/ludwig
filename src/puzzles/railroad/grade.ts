import type { Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import type { Layout } from "./engine";
import {
  type Technique,
  ladder,
  isSolved,
  piecesOf,
  stateFor,
} from "./propagate";

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
