import {
  bit,
  bitCount,
  type CandidateState,
  combinations,
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
import {
  boxUnits,
  classicUnits,
  colUnits,
  rowUnits,
  type Grid,
  type Units,
} from "./engine";

const SIZE = 9;

const lines = [...rowUnits, ...colUnits];

const openWith = (state: CandidateState, cells: ReadonlyArray<number>, digit: number) =>
  cells.filter((index) => !state.grid[index] && state.cand[index] & bit(digit));

/** A digit confined to the overlap of two units leaves the rest of the other unit. */
function lockedCandidates(
  name: string,
  from: ReadonlyArray<ReadonlyArray<number>>,
  to: ReadonlyArray<ReadonlyArray<number>>,
): Technique {
  return {
    name,
    level: 3,
    apply(state) {
      let progress = false;
      for (const source of from) {
        for (let digit = 1; digit <= SIZE; digit++) {
          const cells = openWith(state, source, digit);
          if (cells.length < 2) continue;
          const target = to.find((unit) =>
            cells.every((index) => unit.includes(index)),
          );
          if (!target) continue;
          for (const index of target) {
            if (!source.includes(index) && eliminate(state, index, bit(digit))) {
              progress = true;
            }
          }
          if (progress) return true;
        }
      }
      return false;
    },
  };
}

/** n base lines holding a digit in only n cover lines clear that digit from the rest of the cover lines. */
function fish(name: string, size: number, level: Difficulty): Technique {
  return {
    name,
    level,
    apply(state) {
      const orientations = [
        [rowUnits, colUnits],
        [colUnits, rowUnits],
      ] as const;
      for (const [bases, covers] of orientations) {
        for (let digit = 1; digit <= SIZE; digit++) {
          const lines = bases.filter((base) => {
            const count = openWith(state, base, digit).length;
            return count >= 2 && count <= size;
          });
          let progress = false;
          combinations(lines, size, (picked) => {
            const coverIndexes = new Set<number>();
            for (const base of picked) {
              for (const index of openWith(state, base, digit)) {
                coverIndexes.add(covers.findIndex((cover) => cover.includes(index)));
              }
            }
            if (coverIndexes.size !== size) return false;
            for (const coverIndex of coverIndexes) {
              for (const index of covers[coverIndex]) {
                if (
                  !picked.some((base) => base.includes(index)) &&
                  eliminate(state, index, bit(digit))
                ) {
                  progress = true;
                }
              }
            }
            return progress;
          });
          if (progress) return true;
        }
      }
      return false;
    },
  };
}

const sees = (state: CandidateState, a: number, b: number) =>
  state.peers[a].includes(b);

/** A pivot of {A,B} with pincers {A,C} and {B,C}: C leaves every cell that sees both pincers. */
const xyWing: Technique = {
  name: "xy-wing",
  level: 4,
  apply(state) {
    const bivalue = state.cand
      .map((mask, index) => ({ mask, index }))
      .filter(({ mask, index }) => !state.grid[index] && bitCount(mask) === 2);
    for (const pivot of bivalue) {
      const wings = bivalue.filter(
        ({ mask, index }) =>
          sees(state, pivot.index, index) && bitCount(mask & pivot.mask) === 1,
      );
      for (const first of wings) {
        for (const second of wings) {
          if (first.index >= second.index) continue;
          const shared = first.mask & second.mask;
          const firstLink = first.mask & pivot.mask;
          const secondLink = second.mask & pivot.mask;
          if (firstLink === secondLink || bitCount(shared) !== 1) continue;
          if (shared & pivot.mask) continue;
          let progress = false;
          for (const index of state.peers[first.index]) {
            if (
              index !== pivot.index &&
              index !== second.index &&
              sees(state, second.index, index) &&
              eliminate(state, index, shared)
            ) {
              progress = true;
            }
          }
          if (progress) return true;
        }
      }
    }
    return false;
  },
};

/** A pivot of {A,B,C} with pincers {A,C} and {B,C}: C leaves every cell that sees all three. */
const xyzWing: Technique = {
  name: "xyz-wing",
  level: 5,
  apply(state) {
    for (let pivot = 0; pivot < state.cand.length; pivot++) {
      const pivotMask = state.cand[pivot];
      if (state.grid[pivot] || bitCount(pivotMask) !== 3) continue;
      const wings = state.peers[pivot].filter(
        (index) =>
          !state.grid[index] &&
          bitCount(state.cand[index]) === 2 &&
          (state.cand[index] & pivotMask) === state.cand[index],
      );
      for (const first of wings) {
        for (const second of wings) {
          if (first >= second) continue;
          const shared = state.cand[first] & state.cand[second];
          if (bitCount(shared) !== 1) continue;
          if ((state.cand[first] | state.cand[second]) !== pivotMask) continue;
          let progress = false;
          for (const index of state.peers[pivot]) {
            if (
              index !== first &&
              index !== second &&
              sees(state, first, index) &&
              sees(state, second, index) &&
              eliminate(state, index, shared)
            ) {
              progress = true;
            }
          }
          if (progress) return true;
        }
      }
    }
    return false;
  },
};

/** Easiest first, for the given houses (boxes, jigsaw regions or rainbow colour groups). A puzzle's difficulty is the level of the hardest technique it needs. */
const ladderFor = (houses: Units): ReadonlyArray<Technique> => [
  nakedSingle,
  hiddenSingle,
  lockedCandidates("pointing", houses, lines),
  lockedCandidates("box/line", lines, houses),
  nakedSubset("naked pair", 2, 3),
  hiddenSubset("hidden pair", 2, 3),
  fish("x-wing", 2, 4),
  xyWing,
  fish("swordfish", 3, 5),
  xyzWing,
  nakedSubset("naked triple", 3, 5),
  hiddenSubset("hidden triple", 3, 5),
];

export const ladder = ladderFor(boxUnits);

/** Grades a grid of givens by technique alone, or null when techniques up to `maxLevel` cannot finish it. */
export function gradeSudoku(
  givens: Grid,
  maxLevel: Difficulty = 5,
  units: Units = classicUnits,
): Grade | null {
  return gradeByTechnique(
    createState(givens, SIZE, units),
    ladderFor(units.slice(lines.length)),
    maxLevel,
  );
}
