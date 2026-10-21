import type { Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import type { Content } from "./schema";
import { regionCells } from "./verify";

const OPEN = 0;
const SHADED = 1;
const EMPTY = 2;

type Cells = ReadonlyArray<number>;

type Board = {
  regions: Cells[];
  neighbours: Cells[];
};

type State = { board: Board; cells: number[] };

type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: State) => boolean;
};

const shadedAround = ({ board, cells }: State, index: number) =>
  board.neighbours[index].filter((next) => cells[next] === SHADED).length;

const openAround = ({ board, cells }: State, index: number) =>
  board.neighbours[index].filter((next) => cells[next] === OPEN);

const shadedIn = (state: State, region: Cells) =>
  region.filter((index) => state.cells[index] === SHADED).length;

const openIn = (state: State, region: Cells) =>
  region.filter((index) => state.cells[index] === OPEN);

/** A broken rule: a region that cannot hold two shaded cells, or a shaded cell that cannot be part of exactly one domino. */
function contradicts(state: State) {
  for (const region of state.board.regions) {
    const shaded = shadedIn(state, region);
    if (shaded > 2 || shaded + openIn(state, region).length < 2) return true;
  }
  return state.cells.some((cell, index) => {
    if (cell !== SHADED) return false;
    const shaded = shadedAround(state, index);
    return shaded > 1 || (shaded === 0 && !openAround(state, index).length);
  });
}

/** A region with two shaded cells clears the rest; a region with only as many open cells as it needs shades them all. */
const regionOfTwo: Technique = {
  name: "region of two",
  level: 1,
  apply(state) {
    let progress = false;
    for (const region of state.board.regions) {
      const need = 2 - shadedIn(state, region);
      const open = openIn(state, region);
      if (!open.length || (need > 0 && open.length !== need)) continue;
      for (const index of open) state.cells[index] = need ? SHADED : EMPTY;
      progress = true;
    }
    return progress;
  },
};

/** A lone shaded cell with one open neighbour shades it; a cell in a finished domino clears its other neighbours. */
const dominoCompletion: Technique = {
  name: "domino completion",
  level: 1,
  apply(state) {
    let progress = false;
    state.cells.forEach((cell, index) => {
      if (cell !== SHADED) return;
      const open = openAround(state, index);
      if (!open.length) return;
      if (shadedAround(state, index) === 1) {
        for (const next of open) state.cells[next] = EMPTY;
        progress = true;
      } else if (open.length === 1) {
        state.cells[open[0]] = SHADED;
        progress = true;
      }
    });
    return progress;
  },
};

/** An open cell is empty when shading it would give a neighbour a second shaded neighbour, or leave it with no partner. */
const noTouching: Technique = {
  name: "no touching",
  level: 2,
  apply(state) {
    let progress = false;
    state.cells.forEach((cell, index) => {
      if (cell !== OPEN) return;
      const partnered = state.board.neighbours[index].some(
        (next) =>
          state.cells[next] === OPEN ||
          (state.cells[next] === SHADED && shadedAround(state, next) === 0),
      );
      if (shadedAround(state, index) > 1 || !partnered) {
        state.cells[index] = EMPTY;
        progress = true;
      }
    });
    return progress;
  },
};

const pairsOf = (open: Cells) =>
  open.flatMap((a, i) => open.slice(i + 1).map((b) => [a, b]));

/**
 * Tries every way a region could take the shaded cells it still needs. A cell in none of the
 * workable ways is empty, and a cell in all of them is shaded.
 */
const regionPairs: Technique = {
  name: "region pairs",
  level: 3,
  apply(state) {
    for (const region of state.board.regions) {
      const need = 2 - shadedIn(state, region);
      const open = openIn(state, region);
      if (need < 1 || open.length <= need) continue;
      const picks = need === 1 ? open.map((index) => [index]) : pairsOf(open);
      const workable = picks.filter((pick) => {
        for (const index of pick) state.cells[index] = SHADED;
        const ok = !contradicts(state);
        for (const index of pick) state.cells[index] = OPEN;
        return ok;
      });
      if (!workable.length) continue;
      let progress = false;
      for (const index of open) {
        const count = workable.filter((pick) => pick.includes(index)).length;
        if (count === 0 || count === workable.length) {
          state.cells[index] = count ? SHADED : EMPTY;
          progress = true;
        }
      }
      if (progress) return true;
    }
    return false;
  },
};

const simple: ReadonlyArray<Technique> = [
  regionOfTwo,
  dominoCompletion,
  noTouching,
  regionPairs,
];

/** Applies the techniques up to `maxLevel` until none helps. True when a rule breaks on the way. */
function propagate(state: State, maxLevel: Difficulty) {
  for (;;) {
    if (contradicts(state)) return true;
    if (!simple.some((tech) => tech.level <= maxLevel && tech.apply(state))) {
      return false;
    }
  }
}

/** Assumes each open cell shaded then empty and propagates up to `inner`: the assumption that breaks a rule is wrong. */
const lookahead = (
  name: string,
  level: Difficulty,
  inner: Difficulty,
): Technique => ({
  name,
  level,
  apply(state) {
    for (let index = 0; index < state.cells.length; index++) {
      if (state.cells[index] !== OPEN) continue;
      for (const guess of [SHADED, EMPTY]) {
        const trial = { board: state.board, cells: [...state.cells] };
        trial.cells[index] = guess;
        if (propagate(trial, inner)) {
          state.cells[index] = guess === SHADED ? EMPTY : SHADED;
          return true;
        }
      }
    }
    return false;
  },
});

const ladder: ReadonlyArray<Technique> = [
  ...simple,
  lookahead("assumption", 4, 2),
  lookahead("deep assumption", 5, 3),
];

function boardFor({ rows, cols, grid }: Pick<Content, "rows" | "cols" | "grid">) {
  const regionOf = regionCells({ grid }).map(({ region }) => region);
  const count = Math.max(...regionOf) + 1;
  const neighbours = regionOf.map((_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const next: number[] = [];
    if (row > 0) next.push(index - cols);
    if (row < rows - 1) next.push(index + cols);
    if (col > 0) next.push(index - 1);
    if (col < cols - 1) next.push(index + 1);
    return next;
  });
  return {
    neighbours,
    regions: Array.from({ length: count }, (_, region) =>
      regionOf.flatMap((of, index) => (of === region ? [index] : [])),
    ),
  } satisfies Board;
}

/**
 * Grades a norinori by technique alone, easiest first: null when the techniques up to `maxLevel`
 * cannot shade it, which is what a puzzle that needs trial and error looks like. Also returns the
 * shaded cells it found.
 */
export function solveNorinori(
  content: Pick<Content, "rows" | "cols" | "grid">,
  maxLevel: Difficulty = 5,
) {
  const state: State = {
    board: boardFor(content),
    cells: Array<number>(content.rows * content.cols).fill(OPEN),
  };
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  while (state.cells.includes(OPEN)) {
    if (contradicts(state)) return null;
    const next = ladder.find(
      (technique) => technique.level <= maxLevel && technique.apply(state),
    );
    if (!next) return null;
    uses[next.name] = (uses[next.name] ?? 0) + 1;
    if (next.level > hardest.level) hardest = next;
  }
  if (contradicts(state)) return null;
  const shaded = state.cells.flatMap((cell, index) =>
    cell === SHADED ? [index] : [],
  );
  const grade: Grade = {
    difficulty: hardest.level,
    hardest: hardest.name,
    uses,
  };
  return { grade, shaded };
}

export const gradeNorinori = (
  content: Pick<Content, "rows" | "cols" | "grid">,
  maxLevel: Difficulty = 5,
) => solveNorinori(content, maxLevel)?.grade ?? null;
