import { combinations, type Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import { boxOf, SIZE, type Layout } from "./engine";

/** Slots 0-8 are digits, 9-17 rows, 18-26 columns, 27-35 boxes: each is covered by exactly one circle. */
const TYPES = [0, 1, 2, 3];

const slotsOf = (index: number, digit: number) => [
  digit - 1,
  9 + Math.floor(index / SIZE),
  18 + (index % SIZE),
  27 + boxOf(index),
];

type State = {
  slotsByCell: Map<number, number[]>;
  alive: Set<number>;
  covered: boolean[];
  chosen: number[];
};

type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: State) => boolean;
};

const inSlot = (state: State, index: number, slot: number) =>
  state.slotsByCell.get(index)!.includes(slot);

const openCells = (state: State, slot: number) =>
  [...state.alive].filter((index) => inSlot(state, index, slot));

function choose(state: State, index: number) {
  const own = state.slotsByCell.get(index)!;
  state.chosen.push(index);
  for (const slot of own) state.covered[slot] = true;
  for (const other of [...state.alive]) {
    if (state.slotsByCell.get(other)!.some((slot) => own.includes(slot))) {
      state.alive.delete(other);
    }
  }
}

const uncovered = (state: State, type: number) =>
  Array.from({ length: SIZE }, (_, i) => type * SIZE + i).filter(
    (slot) => !state.covered[slot],
  );

/** A digit, row, column or box with one cell left that can be circled. */
const onlyCell: Technique = {
  name: "only cell",
  level: 1,
  apply(state) {
    for (let slot = 0; slot < 36; slot++) {
      if (state.covered[slot]) continue;
      const open = openCells(state, slot);
      if (open.length === 1) {
        choose(state, open[0]);
        return true;
      }
    }
    return false;
  },
};

/**
 * n lines of one kind (digits, rows, columns or boxes) whose circles can only sit in n lines of
 * another kind: those lines get their circles there, so the cells they hold outside the n lines
 * are not circled. One line is the pointing case; larger n are fish.
 */
function fish(count: number, name: string, level: Difficulty): Technique {
  return {
    name,
    level,
    apply(state) {
      for (const from of TYPES) {
        for (const to of TYPES) {
          if (from === to) continue;
          const targets = uncovered(state, to);
          let progress = false;
          combinations(uncovered(state, from), count, (slots) => {
            const cells = new Set(
              slots.flatMap((slot) => openCells(state, slot)),
            );
            const touching = targets.filter((slot) =>
              [...cells].some((index) => inSlot(state, index, slot)),
            );
            if (touching.length !== count) return false;
            for (const index of [...state.alive]) {
              if (
                !cells.has(index) &&
                touching.some((slot) => inSlot(state, index, slot))
              ) {
                state.alive.delete(index);
                progress = true;
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

/** A cell is not circled when circling it would leave a digit, row, column or box with nothing left to circle. */
const starved: Technique = {
  name: "starved line",
  level: 3,
  apply(state) {
    for (const index of state.alive) {
      const own = state.slotsByCell.get(index)!;
      const others = [...state.alive].filter(
        (other) =>
          other !== index &&
          !state.slotsByCell.get(other)!.some((slot) => own.includes(slot)),
      );
      const reachable = new Set(
        others.flatMap((other) => state.slotsByCell.get(other)!),
      );
      const stuck = Array.from({ length: 36 }, (_, slot) => slot).some(
        (slot) =>
          !state.covered[slot] && !own.includes(slot) && !reachable.has(slot),
      );
      if (stuck) {
        state.alive.delete(index);
        return true;
      }
    }
    return false;
  },
};

const ladder: ReadonlyArray<Technique> = [
  onlyCell,
  fish(1, "line in a line", 2),
  starved,
  fish(2, "2 lines", 3),
  fish(3, "3 lines", 4),
  fish(4, "4 lines", 5),
];

/**
 * Grades a circle9 grid by technique alone, easiest first: null when the techniques up to
 * `maxLevel` cannot place all nine circles, which is what a puzzle that needs trial and error
 * looks like. Also returns the circled cells.
 */
export function solveCircle9({ digits }: Layout, maxLevel: Difficulty = 5) {
  const slotsByCell = new Map<number, number[]>();
  digits.forEach((digit, index) => {
    if (digit) slotsByCell.set(index, slotsOf(index, digit));
  });
  const state: State = {
    slotsByCell,
    alive: new Set(slotsByCell.keys()),
    covered: Array<boolean>(36).fill(false),
    chosen: [],
  };
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  while (state.chosen.length < SIZE) {
    const next = ladder.find(
      (technique) => technique.level <= maxLevel && technique.apply(state),
    );
    if (!next) return null;
    uses[next.name] = (uses[next.name] ?? 0) + 1;
    if (next.level > hardest.level) hardest = next;
  }
  const grade: Grade = {
    difficulty: hardest.level,
    hardest: hardest.name,
    uses,
  };
  return { grade, circled: [...state.chosen].sort((a, b) => a - b) };
}

export const gradeCircle9 = (layout: Layout, maxLevel: Difficulty = 5) =>
  solveCircle9(layout, maxLevel)?.grade ?? null;
