import { combinations, type Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import { type Layout, layoutOf } from "./engine";
import type { Content } from "./schema";
import { regionCells } from "./verify";

const OPEN = 0;
const SHADED = 1;
const EMPTY = 2;

type Cells = ReadonlyArray<number>;

type Board = {
  regionOf: Cells;
  regions: Cells[];
  neighbours: Cells[];
  /** The regions that share an edge with each region. */
  adjacent: Cells[];
};

type State = { board: Board; cells: number[] };

type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: State) => boolean;
};

const shadedAround = ({ board, cells }: State, index: number) =>
  board.neighbours[index].filter((next) => cells[next] === SHADED).length;

const isLone = (state: State, index: number) =>
  state.cells[index] === SHADED && shadedAround(state, index) === 0;

/**
 * The cells that could still be the other half of `index`'s domino: a lone shaded neighbour, or an
 * open neighbour that no other shaded cell touches. A shaded cell already in a domino has none left.
 */
function partnersOf(state: State, index: number): Cells {
  const { board, cells } = state;
  const shadedNext = board.neighbours[index].filter(
    (next) => cells[next] === SHADED,
  );
  if (shadedNext.length > 1) return [];
  if (shadedNext.length === 1) {
    return cells[index] === OPEN && isLone(state, shadedNext[0])
      ? [shadedNext[0]]
      : [];
  }
  const own = cells[index] === SHADED ? 1 : 0;
  return board.neighbours[index].filter(
    (next) => cells[next] === OPEN && shadedAround(state, next) === own,
  );
}

const shadedIn = (state: State, region: Cells) =>
  region.filter((index) => state.cells[index] === SHADED).length;

const openIn = (state: State, region: Cells) =>
  region.filter((index) => state.cells[index] === OPEN);

/** A broken rule: a region that cannot hold two shaded cells, or a shaded cell that cannot be in exactly one domino. */
function contradicts(state: State) {
  for (const region of state.board.regions) {
    const shaded = shadedIn(state, region);
    if (shaded > 2 || shaded + openIn(state, region).length < 2) return true;
  }
  return state.cells.some((cell, index) => {
    if (cell !== SHADED) return false;
    const shaded = shadedAround(state, index);
    return shaded > 1 || (shaded === 0 && !partnersOf(state, index).length);
  });
}

function set(state: State, index: number, value: number) {
  if (state.cells[index] === value) return false;
  state.cells[index] = value;
  return true;
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
      for (const index of open) set(state, index, need ? SHADED : EMPTY);
      progress = true;
    }
    return progress;
  },
};

/** A cell in a finished domino clears its other neighbours; a lone shaded cell with one possible partner shades it. */
const dominoCompletion: Technique = {
  name: "domino completion",
  level: 1,
  apply(state) {
    let progress = false;
    state.cells.forEach((cell, index) => {
      if (cell !== SHADED) return;
      if (shadedAround(state, index) === 1) {
        for (const next of state.board.neighbours[index]) {
          if (state.cells[next] === OPEN) {
            progress = set(state, next, EMPTY) || progress;
          }
        }
        return;
      }
      const partners = partnersOf(state, index);
      if (partners.length === 1) {
        progress = set(state, partners[0], SHADED) || progress;
      }
    });
    return progress;
  },
};

/** An open cell is empty when shading it would touch two shaded cells or a finished domino, or when nothing could be its partner. */
const noTouching: Technique = {
  name: "no touching",
  level: 1,
  apply(state) {
    let progress = false;
    state.cells.forEach((cell, index) => {
      if (cell === OPEN && !partnersOf(state, index).length) {
        progress = set(state, index, EMPTY) || progress;
      }
    });
    return progress;
  },
};

/** A lone shaded cell's partner is one of a few cells: an open cell beside every one of them would touch it, so it is empty. */
const sharedNeighbour: Technique = {
  name: "shared neighbour",
  level: 2,
  apply(state) {
    let progress = false;
    state.cells.forEach((cell, index) => {
      if (!isLone(state, index)) return;
      const partners = partnersOf(state, index);
      if (partners.length < 2) return;
      const beside = new Set(
        state.board.neighbours[partners[0]].filter((other) =>
          partners.every(
            (partner) =>
              other !== partner &&
              state.board.neighbours[partner].includes(other),
          ),
        ),
      );
      for (const other of beside) {
        if (other !== index && state.cells[other] === OPEN) {
          progress = set(state, other, EMPTY) || progress;
        }
      }
    });
    return progress;
  },
};

/**
 * The state after `shade` is shaded and `clear` emptied: a domino finished by the move also empties
 * the cells around it, as the no-touching rule says.
 */
function after(state: State, shade: Cells, clear: Cells): State {
  const trial = { board: state.board, cells: [...state.cells] };
  for (const index of clear) trial.cells[index] = EMPTY;
  for (const index of shade) trial.cells[index] = SHADED;
  for (const index of shade) {
    const shadedNext = state.board.neighbours[index].filter(
      (next) => trial.cells[next] === SHADED,
    );
    if (shadedNext.length !== 1) continue;
    for (const half of [index, shadedNext[0]]) {
      for (const next of state.board.neighbours[half]) {
        if (trial.cells[next] === OPEN) trial.cells[next] = EMPTY;
      }
    }
  }
  return trial;
}

/** The state after a region takes `pick` as the shaded cells it still needs and gives up its other open cells. */
const taking = (state: State, region: Cells, pick: Cells) =>
  after(
    state,
    pick,
    openIn(state, region).filter((index) => !pick.includes(index)),
  );

/** A lone shaded cell's partner can only be a cell that holds up on the spot; one left is shaded. */
const partnerWays: Technique = {
  name: "partner ways",
  level: 3,
  apply(state) {
    for (let index = 0; index < state.cells.length; index++) {
      if (!isLone(state, index)) continue;
      const partners = partnersOf(state, index);
      if (partners.length < 2) continue;
      const workable = partners.filter(
        (partner) => !contradicts(after(state, [partner], [])),
      );
      if (workable.length === 1) return set(state, workable[0], SHADED);
      if (workable.length && workable.length < partners.length) {
        let progress = false;
        for (const partner of partners) {
          if (!workable.includes(partner)) {
            progress = set(state, partner, EMPTY) || progress;
          }
        }
        if (progress) return true;
      }
    }
    return false;
  },
};

/** Every way the region could still take the shaded cells it needs without breaking a rule on the spot. */
function workablePicks(
  state: State,
  region: number,
  deep: boolean,
): number[][] {
  const cells = state.board.regions[region];
  const need = 2 - shadedIn(state, cells);
  const open = openIn(state, cells);
  if (need < 1 || open.length <= need) return [];
  const picks: number[][] = [];
  combinations(open, need, (pick) => {
    const trial = taking(state, cells, pick);
    if (contradicts(trial)) return false;
    if (
      deep &&
      state.board.adjacent[region].some(
        (other) =>
          openIn(trial, state.board.regions[other]).length >
            2 - shadedIn(trial, state.board.regions[other]) &&
          !workablePicks(trial, other, false).length,
      )
    ) {
      return false;
    }
    picks.push([...pick]);
    return false;
  });
  return picks;
}

/**
 * Tries every way a region of at most `maxOpen` open cells could take the shaded cells it still
 * needs. A cell in none of the workable ways is empty, and a cell in all of them is shaded. The
 * deep form also drops a way that leaves a neighbouring region with no way of its own.
 */
const regionPicks = (
  name: string,
  level: Difficulty,
  maxOpen: number,
  deep: boolean,
): Technique => ({
  name,
  level,
  apply(state) {
    for (let region = 0; region < state.board.regions.length; region++) {
      const open = openIn(state, state.board.regions[region]);
      if (open.length > maxOpen) continue;
      const picks = workablePicks(state, region, deep);
      if (!picks.length) continue;
      let progress = false;
      for (const index of open) {
        const count = picks.filter((pick) => pick.includes(index)).length;
        if (count === 0 || count === picks.length) {
          progress = set(state, index, count ? SHADED : EMPTY) || progress;
        }
      }
      if (progress) return true;
    }
    return false;
  },
});

/**
 * Two neighbouring regions taken together: every pair of their workable ways that holds up on the
 * spot. A cell in none of the pairs is empty, and a cell in all of them is shaded.
 */
const regionOverlap: Technique = {
  name: "region overlap",
  level: 5,
  apply(state) {
    const { regions, adjacent } = state.board;
    for (let first = 0; first < regions.length; first++) {
      const firstPicks = workablePicks(state, first, false);
      if (!firstPicks.length) continue;
      for (const second of adjacent[first]) {
        if (second < first) continue;
        const secondPicks = workablePicks(state, second, false);
        if (!secondPicks.length) continue;
        const open = [
          ...openIn(state, regions[first]),
          ...openIn(state, regions[second]),
        ];
        const counts = new Map(open.map((index) => [index, 0]));
        let total = 0;
        for (const a of firstPicks) {
          const taken = taking(state, regions[first], a);
          for (const b of secondPicks) {
            if (contradicts(taking(taken, regions[second], b))) continue;
            total++;
            for (const index of [...a, ...b]) {
              counts.set(index, (counts.get(index) ?? 0) + 1);
            }
          }
        }
        if (!total) continue;
        let progress = false;
        for (const [index, count] of counts) {
          if (count === 0 || count === total) {
            progress = set(state, index, count ? SHADED : EMPTY) || progress;
          }
        }
        if (progress) return true;
      }
    }
    return false;
  },
};

const ladder: ReadonlyArray<Technique> = [
  regionOfTwo,
  dominoCompletion,
  noTouching,
  sharedNeighbour,
  regionPicks("small region ways", 2, 3, false),
  partnerWays,
  regionPicks("region ways", 3, Infinity, false),
  regionPicks("neighbouring regions", 4, Infinity, true),
  regionOverlap,
];

function boardFor({ rows, cols, regionOf }: Layout): Board {
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
  const regions = Array.from({ length: count }, (_, region) =>
    regionOf.flatMap((of, index) => (of === region ? [index] : [])),
  );
  const adjacent = regions.map((cells, region) => [
    ...new Set(
      cells
        .flatMap((index) => neighbours[index])
        .map((index) => regionOf[index])
        .filter((other) => other !== region),
    ),
  ]);
  return { regionOf, regions, neighbours, adjacent };
}

/**
 * Runs the ladder up to `maxLevel` on a layout, easiest technique first, restarting from the
 * easiest after each success. The grade is null when the techniques stall short of a full grid,
 * and the whole result is null when a rule broke.
 */
export function solveLayout(layout: Layout, maxLevel: Difficulty = 5) {
  const state: State = {
    board: boardFor(layout),
    cells: Array<number>(layout.regionOf.length).fill(OPEN),
  };
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  while (state.cells.includes(OPEN)) {
    if (contradicts(state)) return null;
    const next = ladder.find(
      (technique) => technique.level <= maxLevel && technique.apply(state),
    );
    if (!next) break;
    uses[next.name] = (uses[next.name] ?? 0) + 1;
    if (next.level > hardest.level) hardest = next;
  }
  if (contradicts(state)) return null;
  const grade: Grade | null = state.cells.includes(OPEN)
    ? null
    : { difficulty: hardest.level, hardest: hardest.name, uses };
  return { grade, cells: state.cells };
}

/**
 * Grades a norinori by technique alone. The grade and shaded cells are null when the techniques
 * up to `maxLevel` cannot decide every cell, which is what a puzzle that needs trial and error
 * looks like. Null when a rule broke.
 */
export function solveNorinori(
  content: Pick<Content, "rows" | "cols" | "grid">,
  maxLevel: Difficulty = 5,
) {
  const solved = solveLayout(
    layoutOf({ ...content, regions: regionCells(content) }),
    maxLevel,
  );
  if (!solved) return null;
  const shaded = solved.grade
    ? solved.cells.flatMap((cell, index) => (cell === SHADED ? [index] : []))
    : null;
  return { grade: solved.grade, shaded };
}

export const gradeNorinori = (
  content: Pick<Content, "rows" | "cols" | "grid">,
  maxLevel: Difficulty = 5,
) => solveNorinori(content, maxLevel)?.grade ?? null;
