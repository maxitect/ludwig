import {
  bit,
  type CandidateState,
  createState,
  eliminate,
  type Grade,
  gradeByTechnique,
  hiddenSingle,
  hiddenSubset,
  nakedSingle,
  nakedSubset,
  type Technique,
} from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import { gridFromGivens, orderedPairs } from "./engine";
import type { Payload } from "./schema";

type Puzzle = Pick<Payload, "size" | "givens" | "inequalities">;

const effective = (state: CandidateState, index: number) =>
  state.grid[index] ? bit(state.grid[index]) : state.cand[index];

const highest = (mask: number) => 31 - Math.clz32(mask);
const lowest = (mask: number) => 31 - Math.clz32(mask & -mask);

/** Digits at or above `digit`, and at or below it. */
const atLeast = (digit: number) => ~(bit(digit) - 1);
const atMost = (digit: number) => bit(digit + 1) - 1;

function pruneSign(state: CandidateState, smaller: number, larger: number) {
  const smallerMask = effective(state, smaller);
  const largerMask = effective(state, larger);
  if (!smallerMask || !largerMask) return false;
  const lowered = eliminate(state, smaller, atLeast(highest(largerMask)));
  const raised = eliminate(state, larger, atMost(lowest(smallerMask)));
  return lowered || raised;
}

function signBounds(pairs: ReadonlyArray<ReadonlyArray<number>>): Technique {
  return {
    name: "sign bounds",
    level: 2,
    apply(state) {
      let progress = false;
      for (const [smaller, larger] of pairs) {
        if (pruneSign(state, smaller, larger)) progress = true;
      }
      return progress;
    },
  };
}

/** Easiest first. A puzzle's difficulty is the level of the hardest technique it needs. */
function ladderFor(pairs: ReadonlyArray<ReadonlyArray<number>>) {
  return [
    nakedSingle,
    { ...hiddenSingle, level: 1 },
    signBounds(pairs),
    nakedSubset("naked pair", 2, 3),
    hiddenSubset("hidden pair", 2, 4),
    nakedSubset("naked triple", 3, 4),
    hiddenSubset("hidden triple", 3, 5),
  ] satisfies Technique[];
}

/**
 * Grades a puzzle by technique alone, or null when techniques up to `maxLevel` cannot finish it.
 * A placed digit prunes the cells it is signed against at once, which is the entry level.
 */
export function gradeFutoshiki(
  puzzle: Puzzle,
  maxLevel: Difficulty = 5,
): Grade | null {
  const { size, givens, inequalities } = puzzle;
  const pairs = orderedPairs(size, inequalities);
  const rows = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => row * size + col),
  );
  const cols = Array.from({ length: size }, (_, col) =>
    Array.from({ length: size }, (_, row) => row * size + col),
  );
  const state = createState(
    gridFromGivens(size, givens),
    size,
    [...rows, ...cols],
    (current, index, digit) => {
      for (const [smaller, larger] of pairs) {
        if (smaller === index) eliminate(current, larger, atMost(digit));
        if (larger === index) eliminate(current, smaller, atLeast(digit));
      }
    },
  );
  return gradeByTechnique(state, ladderFor(pairs), maxLevel);
}
