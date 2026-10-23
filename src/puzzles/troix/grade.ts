import type { Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import { gridFromGivens } from "./engine";
import type { Payload } from "./schema";

type Puzzle = Pick<Payload, "size" | "givens">;

/** Per cell, a bitmask of the symbols still possible (bit 0 is X, 1 is O, 2 is I). One bit means placed. */
type State = { quota: number; lines: number[][]; dom: number[] };

type Outcome = boolean | "dead";

type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: State) => Outcome;
};

const ALL = 0b111;
const symbolsOf = (mask: number) => [0, 1, 2].filter((s) => mask & (1 << s));
const isPlaced = (mask: number) => mask !== 0 && (mask & (mask - 1)) === 0;

function linesOf(size: number) {
  return Array.from({ length: 2 * size }, (_, line) =>
    Array.from({ length: size }, (_, at) =>
      line < size ? line * size + at : at * size + (line - size),
    ),
  );
}

/** Takes the symbols in `mask` out of a cell. True on a change, "dead" when none is left. */
function remove(state: State, index: number, mask: number): Outcome {
  const before = state.dom[index];
  if (!(before & mask)) return false;
  state.dom[index] = before & ~mask;
  return state.dom[index] ? true : "dead";
}

/** Runs `step` over every line, stopping at the first contradiction. */
function overLines(state: State, step: (line: number[]) => Outcome): Outcome {
  let progress = false;
  for (const line of state.lines) {
    const result = step(line);
    if (result === "dead") return "dead";
    if (result) progress = true;
  }
  return progress;
}

const placedSymbol = (state: State, index: number) =>
  isPlaced(state.dom[index]) ? Math.log2(state.dom[index]) : -1;

/** Removes `mask` from each listed cell, keeping track of progress. */
function removeAll(
  state: State,
  indexes: ReadonlyArray<number>,
  mask: number,
): Outcome {
  let progress = false;
  for (const index of indexes) {
    const result = remove(state, index, mask);
    if (result === "dead") return "dead";
    if (result) progress = true;
  }
  return progress;
}

const merge = (a: Outcome, b: Outcome): Outcome =>
  a === "dead" || b === "dead" ? "dead" : a || b;

/** A line holding its quota of a symbol rules it out of the line's other cells. */
const quotaFull: Technique = {
  name: "line at quota",
  level: 1,
  apply: (state) =>
    overLines(state, (line) => {
      let progress: Outcome = false;
      for (let symbol = 0; symbol < 3; symbol++) {
        const held = line.filter((i) => placedSymbol(state, i) === symbol);
        if (held.length < state.quota) continue;
        progress = merge(
          progress,
          removeAll(
            state,
            line.filter((i) => !held.includes(i)),
            1 << symbol,
          ),
        );
        if (progress === "dead") return "dead";
      }
      return progress;
    }),
};

/** Two alike side by side rule that symbol out of the cells at both ends. */
const pairEnds: Technique = {
  name: "pair ends",
  level: 1,
  apply: (state) =>
    overLines(state, (line) => {
      let progress: Outcome = false;
      for (let at = 0; at + 1 < line.length; at++) {
        const symbol = placedSymbol(state, line[at]);
        if (symbol < 0 || placedSymbol(state, line[at + 1]) !== symbol) continue;
        const ends = [line[at - 1], line[at + 2]].filter(
          (end) => end !== undefined,
        );
        progress = merge(progress, removeAll(state, ends, 1 << symbol));
        if (progress === "dead") return "dead";
      }
      return progress;
    }),
};

/** Two alike with one cell between rule that symbol out of the cell between. */
const gap: Technique = {
  name: "gap",
  level: 2,
  apply: (state) =>
    overLines(state, (line) => {
      let progress: Outcome = false;
      for (let at = 0; at + 2 < line.length; at++) {
        const symbol = placedSymbol(state, line[at]);
        if (symbol < 0 || placedSymbol(state, line[at + 2]) !== symbol) continue;
        progress = merge(progress, remove(state, line[at + 1], 1 << symbol));
        if (progress === "dead") return "dead";
      }
      return progress;
    }),
};

/** A symbol a line still needs, with exactly as many cells able to hold it, goes in all of them. */
const onlyPlaces: Technique = {
  name: "only places",
  level: 3,
  apply: (state) =>
    overLines(state, (line) => {
      let progress: Outcome = false;
      for (let symbol = 0; symbol < 3; symbol++) {
        const held = line.filter((i) => placedSymbol(state, i) === symbol).length;
        const open = line.filter(
          (i) => !isPlaced(state.dom[i]) && state.dom[i] & (1 << symbol),
        );
        const need = state.quota - held;
        if (need < 0 || open.length < need) return "dead";
        if (need === 0 || open.length !== need) continue;
        progress = merge(progress, removeAll(state, open, ALL & ~(1 << symbol)));
        if (progress === "dead") return "dead";
      }
      return progress;
    }),
};

/** Every arrangement of one line that fits its cells' symbols; a symbol none of them uses is ruled out. */
const lineArrangements: Technique = {
  name: "line arrangements",
  level: 4,
  apply: (state) =>
    overLines(state, (line) => {
      const seen = line.map(() => 0);
      const counts = [0, 0, 0];
      const picked: number[] = [];
      const walk = (at: number) => {
        if (at === line.length) {
          picked.forEach((symbol, i) => {
            seen[i] |= 1 << symbol;
          });
          return;
        }
        for (const symbol of symbolsOf(state.dom[line[at]])) {
          if (counts[symbol] >= state.quota) continue;
          if (at >= 2 && picked[at - 1] === symbol && picked[at - 2] === symbol) {
            continue;
          }
          counts[symbol]++;
          picked.push(symbol);
          walk(at + 1);
          picked.pop();
          counts[symbol]--;
        }
      };
      walk(0);
      let progress: Outcome = false;
      for (let at = 0; at < line.length; at++) {
        if (!seen[at]) return "dead";
        progress = merge(progress, remove(state, line[at], ALL & ~seen[at]));
        if (progress === "dead") return "dead";
      }
      return progress;
    }),
};

/** Applies the techniques of levels 1 to 4 until none helps. True when the state reaches a contradiction. */
function propagatesToContradiction(state: State) {
  for (;;) {
    let progress = false;
    for (const technique of ladder) {
      if (technique.level > 4) break;
      const result = technique.apply(state);
      if (result === "dead") return true;
      if (result) {
        progress = true;
        break;
      }
    }
    if (!progress) return false;
  }
}

/** A symbol that, assumed in a cell, forces a contradiction by the simpler techniques is ruled out of it. */
const contradiction: Technique = {
  name: "contradiction",
  level: 5,
  apply: (state) => {
    for (let index = 0; index < state.dom.length; index++) {
      if (isPlaced(state.dom[index])) continue;
      for (const symbol of symbolsOf(state.dom[index])) {
        const trial: State = { ...state, dom: [...state.dom] };
        trial.dom[index] = 1 << symbol;
        if (propagatesToContradiction(trial)) {
          return remove(state, index, 1 << symbol);
        }
      }
    }
    return false;
  },
};

/** Easiest first. A puzzle's difficulty is the level of the hardest technique it needs. */
const ladder: ReadonlyArray<Technique> = [
  quotaFull,
  pairEnds,
  gap,
  onlyPlaces,
  lineArrangements,
  contradiction,
];

/**
 * Solves a puzzle by technique alone and returns the filled grid (1 to 3 per cell) with its grade,
 * or null when techniques up to `maxLevel` cannot finish it. The grade is the hardest level used.
 */
export function solveTroix(puzzle: Puzzle, maxLevel: Difficulty = 5) {
  const { size, givens } = puzzle;
  const state: State = {
    quota: size / 3,
    lines: linesOf(size),
    dom: gridFromGivens(size, givens).map((code) =>
      code ? 1 << (code - 1) : ALL,
    ),
  };
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  while (!state.dom.every(isPlaced)) {
    let applied: Technique | undefined;
    for (const technique of ladder) {
      if (technique.level > maxLevel) break;
      const result = technique.apply(state);
      if (result === "dead") return null;
      if (result) {
        applied = technique;
        break;
      }
    }
    if (!applied) return null;
    uses[applied.name] = (uses[applied.name] ?? 0) + 1;
    if (applied.level > hardest.level) hardest = applied;
  }
  const grade: Grade = {
    difficulty: hardest.level,
    hardest: hardest.name,
    uses,
  };
  return { grade, grid: state.dom.map((mask) => Math.log2(mask) + 1) };
}

/** Grades a puzzle by technique alone, or null when techniques up to `maxLevel` cannot finish it. */
export function gradeTroix(puzzle: Puzzle, maxLevel: Difficulty = 5) {
  return solveTroix(puzzle, maxLevel)?.grade ?? null;
}
