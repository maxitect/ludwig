import type { Difficulty } from "./pipeline";

type Units = ReadonlyArray<ReadonlyArray<number>>;

/**
 * Pencil-mark state of a digit grid solved by technique. `cand` holds one bitmask per cell
 * (bit d set while digit d is possible); a placed cell has `cand` 0.
 */
export type CandidateState = {
  grid: number[];
  cand: number[];
  units: Units;
  peers: Units;
  afterPlace?: (state: CandidateState, index: number, digit: number) => void;
};

export type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: CandidateState) => boolean;
};

export type Grade = {
  difficulty: Difficulty;
  hardest: string;
  uses: Readonly<Record<string, number>>;
};

export const bit = (digit: number) => 1 << digit;

export function bitCount(mask: number) {
  let count = 0;
  for (let rest = mask; rest; rest &= rest - 1) count++;
  return count;
}

export function digitsOf(mask: number) {
  const digits: number[] = [];
  for (let digit = 1; mask >> digit; digit++) {
    if (mask & bit(digit)) digits.push(digit);
  }
  return digits;
}

function peersOf(cells: number, units: Units) {
  const peers = Array.from({ length: cells }, () => new Set<number>());
  for (const unit of units) {
    for (const a of unit) for (const b of unit) if (a !== b) peers[a].add(b);
  }
  return peers.map((set) => [...set]);
}

export function place(state: CandidateState, index: number, digit: number) {
  state.grid[index] = digit;
  state.cand[index] = 0;
  for (const peer of state.peers[index]) state.cand[peer] &= ~bit(digit);
  state.afterPlace?.(state, index, digit);
}

/** Removes the digits in `mask` from an unplaced cell. True when a candidate was actually removed. */
export function eliminate(state: CandidateState, index: number, mask: number) {
  if (state.grid[index] || !(state.cand[index] & mask)) return false;
  state.cand[index] &= ~mask;
  return true;
}

export function createState(
  grid: ReadonlyArray<number>,
  maxDigit: number,
  units: Units,
  afterPlace?: CandidateState["afterPlace"],
) {
  const all = (bit(maxDigit + 1) - 1) & ~1;
  const state: CandidateState = {
    grid: Array(grid.length).fill(0),
    cand: Array(grid.length).fill(all),
    units,
    peers: peersOf(grid.length, units),
    afterPlace,
  };
  grid.forEach((digit, index) => {
    if (digit) place(state, index, digit);
  });
  return state;
}

const isSolved = (state: CandidateState) =>
  state.grid.every((digit) => digit !== 0);

const hasDeadCell = (state: CandidateState) =>
  state.grid.some((digit, index) => !digit && !state.cand[index]);

export const nakedSingle: Technique = {
  name: "naked single",
  level: 1,
  apply(state) {
    let progress = false;
    for (let index = 0; index < state.grid.length; index++) {
      if (!state.grid[index] && bitCount(state.cand[index]) === 1) {
        place(state, index, digitsOf(state.cand[index])[0]);
        progress = true;
      }
    }
    return progress;
  },
};

export const hiddenSingle: Technique = {
  name: "hidden single",
  level: 2,
  apply(state) {
    let progress = false;
    for (const unit of state.units) {
      let seen = 0;
      let twice = 0;
      for (const index of unit) {
        twice |= seen & state.cand[index];
        seen |= state.cand[index];
      }
      for (const digit of digitsOf(seen & ~twice)) {
        const cell = unit.find(
          (index) => !state.grid[index] && state.cand[index] & bit(digit),
        );
        if (cell !== undefined) {
          place(state, cell, digit);
          progress = true;
        }
      }
    }
    return progress;
  },
};

/** Calls `visit` with each combination of `size` items until it returns true. */
export function combinations<T>(
  items: ReadonlyArray<T>,
  size: number,
  visit: (picked: ReadonlyArray<T>) => boolean,
) {
  const picked: T[] = [];
  function walk(start: number): boolean {
    if (picked.length === size) return visit(picked);
    for (let i = start; i < items.length; i++) {
      picked.push(items[i]);
      if (walk(i + 1)) return true;
      picked.pop();
    }
    return false;
  }
  walk(0);
}

/** n cells of a unit whose candidates are together only n digits: those digits leave the unit's other cells. */
export function nakedSubset(
  name: string,
  size: number,
  level: Difficulty,
): Technique {
  return {
    name,
    level,
    apply(state) {
      for (const unit of state.units) {
        const open = unit.filter((index) => {
          const count = bitCount(state.cand[index]);
          return !state.grid[index] && count >= 2 && count <= size;
        });
        let progress = false;
        combinations(open, size, (cells) => {
          const union = cells.reduce(
            (mask, index) => mask | state.cand[index],
            0,
          );
          if (bitCount(union) !== size) return false;
          for (const other of unit) {
            if (!cells.includes(other) && eliminate(state, other, union)) {
              progress = true;
            }
          }
          return progress;
        });
        if (progress) return true;
      }
      return false;
    },
  };
}

/** n digits of a unit that fit only n cells: those cells lose every other candidate. */
export function hiddenSubset(
  name: string,
  size: number,
  level: Difficulty,
): Technique {
  return {
    name,
    level,
    apply(state) {
      for (const unit of state.units) {
        let present = 0;
        for (const index of unit) present |= state.cand[index];
        const digits = digitsOf(present).filter((digit) => {
          const spots = unit.filter(
            (index) => !state.grid[index] && state.cand[index] & bit(digit),
          ).length;
          return spots >= 2 && spots <= size;
        });
        let progress = false;
        combinations(digits, size, (picked) => {
          const mask = picked.reduce((all, digit) => all | bit(digit), 0);
          const cells = unit.filter(
            (index) => !state.grid[index] && state.cand[index] & mask,
          );
          if (cells.length !== size) return false;
          for (const index of cells) {
            if (eliminate(state, index, state.cand[index] & ~mask)) {
              progress = true;
            }
          }
          return progress;
        });
        if (progress) return true;
      }
      return false;
    },
  };
}

/**
 * Applies the easiest applicable technique, restarting from the easiest after each success, until
 * the grid is solved. Returns null when the techniques up to `maxLevel` cannot finish it, which is
 * what a puzzle that needs trial and error looks like. The difficulty is the hardest level used.
 */
export function gradeByTechnique(
  state: CandidateState,
  ladder: ReadonlyArray<Technique>,
  maxLevel: Difficulty = 5,
): Grade | null {
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  while (!isSolved(state)) {
    if (hasDeadCell(state)) return null;
    const next = ladder.find(
      (technique) => technique.level <= maxLevel && technique.apply(state),
    );
    if (!next) return null;
    uses[next.name] = (uses[next.name] ?? 0) + 1;
    if (next.level > hardest.level) hardest = next;
  }
  return { difficulty: hardest.level, hardest: hardest.name, uses };
}
