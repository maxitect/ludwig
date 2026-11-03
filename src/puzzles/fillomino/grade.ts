import { bit, type Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import { gridFromGivens } from "./engine";
import type { Content } from "./schema";

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const ALL = DIGITS.reduce((mask, digit) => mask | bit(digit), 0);

type Layout = Pick<Content, "rows" | "cols">;
type Puzzle = Layout & Pick<Content, "givens">;

/** `cells` holds the known digits (0 while empty); `cand` a bitmask of the digits an empty cell could still take. */
type State = {
  next: ReadonlyArray<ReadonlyArray<number>>;
  cells: number[];
  cand: number[];
};

type Area = { digit: number; cells: number[] };

type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: State) => boolean;
};

const tables = new Map<string, ReadonlyArray<ReadonlyArray<number>>>();

function neighbourTable({ rows, cols }: Layout) {
  const key = `${rows}x${cols}`;
  let table = tables.get(key);
  if (!table) {
    table = Array.from({ length: rows * cols }, (_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const found: number[] = [];
      if (row > 0) found.push(index - cols);
      if (col > 0) found.push(index - 1);
      if (col < cols - 1) found.push(index + 1);
      if (row < rows - 1) found.push(index + cols);
      return found;
    });
    tables.set(key, table);
  }
  return table;
}

function put(state: State, index: number, digit: number) {
  state.cells[index] = digit;
  state.cand[index] = 0;
  return true;
}

function drop(state: State, index: number, digit: number) {
  if (state.cells[index] || !(state.cand[index] & bit(digit))) return false;
  state.cand[index] &= ~bit(digit);
  return true;
}

/** The edge-connected groups of equal known digits, with the area each cell is in (-1 for an empty cell). */
function areasOf({ next, cells }: State) {
  const areaOf = Array<number>(cells.length).fill(-1);
  const areas: Area[] = [];
  for (let start = 0; start < cells.length; start++) {
    if (!cells[start] || areaOf[start] !== -1) continue;
    const digit = cells[start];
    const members = [start];
    areaOf[start] = areas.length;
    for (let at = 0; at < members.length; at++) {
      for (const cell of next[members[at]]) {
        if (cells[cell] === digit && areaOf[cell] === -1) {
          areaOf[cell] = areas.length;
          members.push(cell);
        }
      }
    }
    areas.push({ digit, cells: members });
  }
  return { areaOf, areas };
}

/** The empty neighbours of an area. */
function openAround({ next, cells }: State, area: Area) {
  const open = new Set<number>();
  for (const cell of area.cells) {
    for (const beside of next[cell]) if (!cells[beside]) open.add(beside);
  }
  return [...open];
}

/**
 * Everything an area could grow into: the cells reachable through empty cells that may still be its
 * digit, with `blocked` treated as a wall. Known cells of the same digit met on the way join in
 * (`merged`). `empties` are the empty cells reached.
 */
function reach(state: State, area: Area, blocked = -1) {
  const { next, cells, cand } = state;
  const bitOf = bit(area.digit);
  const seen = new Set(area.cells);
  const queue = [...area.cells];
  const empties: number[] = [];
  let merged = false;
  for (let at = 0; at < queue.length; at++) {
    for (const cell of next[queue[at]]) {
      if (seen.has(cell) || cell === blocked) continue;
      if (cells[cell] === area.digit) {
        merged = true;
      } else if (cells[cell] || !(cand[cell] & bitOf)) {
        continue;
      } else {
        empties.push(cell);
      }
      seen.add(cell);
      queue.push(cell);
    }
  }
  return { size: seen.size, empties, merged };
}

function contradicts(state: State) {
  if (state.cells.some((digit, index) => !digit && !state.cand[index])) {
    return true;
  }
  return areasOf(state).areas.some(
    (area) =>
      area.cells.length > area.digit ||
      (area.cells.length < area.digit && reach(state, area).size < area.digit),
  );
}

/** A full area is walled in: its empty neighbours cannot be its digit. */
function sealArea(state: State) {
  let progress = false;
  for (const area of areasOf(state).areas) {
    if (area.cells.length !== area.digit) continue;
    for (const cell of openAround(state, area)) {
      progress = drop(state, cell, area.digit) || progress;
    }
  }
  return progress;
}

function onlyCandidate(state: State) {
  let progress = false;
  state.cells.forEach((digit, index) => {
    const mask = state.cand[index];
    if (digit || !mask || mask & (mask - 1)) return;
    progress = put(state, index, 31 - Math.clz32(mask)) || progress;
  });
  return progress;
}

/** An unfinished area with one empty neighbour that can take its digit must grow there. */
function singleExit(state: State) {
  for (const area of areasOf(state).areas) {
    if (area.cells.length >= area.digit) continue;
    const exits = openAround(state, area).filter(
      (cell) => state.cand[cell] & bit(area.digit),
    );
    if (exits.length === 1) return put(state, exits[0], area.digit);
  }
  return false;
}

/** A cell cannot take a digit when joining the areas of that digit beside it would make one too big. */
function mergeLimit(state: State) {
  const { areaOf, areas } = areasOf(state);
  let progress = false;
  state.cells.forEach((known, index) => {
    if (known) return;
    for (const digit of DIGITS) {
      if (!(state.cand[index] & bit(digit))) continue;
      const touching = new Set<number>();
      for (const cell of state.next[index]) {
        if (areaOf[cell] !== -1 && areas[areaOf[cell]].digit === digit) {
          touching.add(areaOf[cell]);
        }
      }
      let total = 1;
      for (const area of touching) total += areas[area].cells.length;
      if (total > digit) progress = drop(state, index, digit) || progress;
    }
  });
  return progress;
}

/** A cell cannot take a digit when the cells around it that could be that digit number fewer than the digit. */
function room(state: State) {
  const { cells, cand, next } = state;
  let progress = false;
  for (const digit of DIGITS) {
    const bitOf = bit(digit);
    const seen = new Set<number>();
    for (let start = 0; start < cells.length; start++) {
      if (seen.has(start)) continue;
      if (cells[start] !== digit && (cells[start] || !(cand[start] & bitOf))) {
        continue;
      }
      const members = [start];
      seen.add(start);
      for (let at = 0; at < members.length; at++) {
        for (const cell of next[members[at]]) {
          if (seen.has(cell)) continue;
          if (cells[cell] === digit || (!cells[cell] && cand[cell] & bitOf)) {
            seen.add(cell);
            members.push(cell);
          }
        }
      }
      if (members.length >= digit) continue;
      for (const cell of members) {
        progress = drop(state, cell, digit) || progress;
      }
    }
  }
  return progress;
}

/** An unfinished area whose reachable cells are exactly the cells it still needs takes them all. */
function fullReach(state: State) {
  for (const area of areasOf(state).areas) {
    if (area.cells.length >= area.digit) continue;
    const found = reach(state, area);
    if (found.size !== area.digit) continue;
    for (const cell of found.empties) put(state, cell, area.digit);
    return true;
  }
  return false;
}

/** A cell beside an unfinished area, without which the area cannot reach its size, belongs to it. */
function bottleneck(state: State) {
  for (const area of areasOf(state).areas) {
    if (area.cells.length >= area.digit) continue;
    for (const cell of openAround(state, area)) {
      if (state.cells[cell] || !(state.cand[cell] & bit(area.digit))) continue;
      if (reach(state, area, cell).size < area.digit) {
        return put(state, cell, area.digit);
      }
    }
  }
  return false;
}

/** Any cell the unfinished area can reach, not only one beside it, without which it falls short. */
function deepBottleneck(state: State) {
  for (const area of areasOf(state).areas) {
    if (area.cells.length >= area.digit) continue;
    for (const cell of reach(state, area).empties) {
      if (reach(state, area, cell).size < area.digit) {
        return put(state, cell, area.digit);
      }
    }
  }
  return false;
}

type Claim = { digit: number; need: number; pool: ReadonlySet<number> };

/** Unfinished areas that grow through empty cells alone, each with the cells it can still claim. */
function claims(state: State, blocked = -1): Claim[] {
  return areasOf(state).areas.flatMap((area) => {
    const need = area.digit - area.cells.length;
    if (need <= 0) return [];
    const found = reach(state, area, blocked);
    return found.merged
      ? []
      : [{ digit: area.digit, need, pool: new Set(found.empties) }];
  });
}

const shares = (a: Claim, b: Claim) =>
  a.digit !== b.digit && [...a.pool].some((cell) => b.pool.has(cell));

/**
 * When the cells a group of areas can claim together are exactly as many as they need together,
 * every one of those cells is theirs: a cell only one of them can reach takes its digit, and a
 * shared cell is one of their digits.
 */
function settle(state: State, group: ReadonlyArray<Claim>) {
  const union = new Set(group.flatMap(({ pool }) => [...pool]));
  if (union.size !== group.reduce((sum, { need }) => sum + need, 0)) {
    return false;
  }
  let progress = false;
  for (const cell of union) {
    const owners = group.filter(({ pool }) => pool.has(cell));
    if (owners.length === 1) {
      progress = put(state, cell, owners[0].digit) || progress;
    } else {
      const keep = owners.reduce((mask, { digit }) => mask | bit(digit), 0);
      if (state.cand[cell] & ~keep) {
        state.cand[cell] &= keep;
        progress = true;
      }
    }
  }
  return progress;
}

function sharedPoolOfTwo(state: State) {
  const all = claims(state);
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (shares(all[i], all[j]) && settle(state, [all[i], all[j]])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Two areas of different digits that share cells: a cell which, taken out of the grid, leaves them
 * fewer cells to claim together than they need together is one of theirs.
 */
function pooledBottleneck(state: State) {
  const all = claims(state);
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (!shares(all[i], all[j])) continue;
      const group = [all[i], all[j]];
      const needed = all[i].need + all[j].need;
      const options = new Set(group.flatMap(({ pool }) => [...pool]));
      for (const cell of options) {
        const rest = new Set(
          claims(state, cell)
            .filter(({ digit }) => group.some((claim) => claim.digit === digit))
            .flatMap(({ pool }) => [...pool]),
        );
        if (rest.size >= needed) continue;
        const owners = group.filter(({ pool }) => pool.has(cell));
        const keep = owners.reduce((mask, { digit }) => mask | bit(digit), 0);
        if (owners.length === 1) return put(state, cell, owners[0].digit);
        if (state.cand[cell] & ~keep) {
          state.cand[cell] &= keep;
          return true;
        }
      }
    }
  }
  return false;
}

function sharedPoolOfThree(state: State) {
  const all = claims(state);
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (!shares(all[i], all[j])) continue;
      for (let k = j + 1; k < all.length; k++) {
        const linked = shares(all[i], all[k]) || shares(all[j], all[k]);
        const apart =
          all[k].digit !== all[i].digit && all[k].digit !== all[j].digit;
        if (linked && apart && settle(state, [all[i], all[j], all[k]])) {
          return true;
        }
      }
    }
  }
  return false;
}

/** Easiest first. A technique is a deduction within one area, one cell or a small fixed group of areas. */
const ladder: ReadonlyArray<Technique> = [
  { name: "seal full area", level: 1, apply: sealArea },
  { name: "only candidate", level: 1, apply: onlyCandidate },
  { name: "single exit", level: 1, apply: singleExit },
  { name: "merge limit", level: 2, apply: mergeLimit },
  { name: "room", level: 2, apply: room },
  { name: "full reach", level: 3, apply: fullReach },
  { name: "bottleneck", level: 3, apply: bottleneck },
  { name: "deep bottleneck", level: 4, apply: deepBottleneck },
  { name: "shared pool of two", level: 4, apply: sharedPoolOfTwo },
  { name: "pooled bottleneck", level: 5, apply: pooledBottleneck },
  { name: "shared pool of three", level: 5, apply: sharedPoolOfThree },
];

/**
 * Runs the ladder up to `maxLevel`, easiest technique first, restarting from the easiest after
 * each success. `grade` and `cells` are null when the techniques stall short of a full grid, and
 * the whole result is null when a rule broke.
 */
export function solveFillomino(puzzle: Puzzle, maxLevel: Difficulty = 5) {
  const cells = gridFromGivens(puzzle, puzzle.givens);
  const state: State = {
    next: neighbourTable(puzzle),
    cells,
    cand: cells.map((digit) => (digit ? 0 : ALL)),
  };
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  while (state.cells.includes(0)) {
    if (contradicts(state)) return null;
    const step = ladder.find(
      (technique) => technique.level <= maxLevel && technique.apply(state),
    );
    if (!step) break;
    uses[step.name] = (uses[step.name] ?? 0) + 1;
    if (step.level > hardest.level) hardest = step;
  }
  if (contradicts(state)) return null;
  if (state.cells.includes(0)) return { grade: null, cells: null };
  const grade: Grade = {
    difficulty: hardest.level,
    hardest: hardest.name,
    uses,
  };
  return { grade, cells: state.cells };
}

export const gradeFillomino = (puzzle: Puzzle, maxLevel: Difficulty = 5) =>
  solveFillomino(puzzle, maxLevel)?.grade ?? null;
