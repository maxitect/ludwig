import type { Difficulty } from "../_shared/generate/pipeline";
import { OPEN, SIDES, STEP, OPPOSITE, pieceJoining } from "./geometry";
import type { Layout } from "./engine";
import type { Cell, Placed, Side } from "./schema";

export const UNKNOWN = 0;
export const YES = 1;
export const NO = 2;

export type Mark = typeof UNKNOWN | typeof YES | typeof NO;

/**
 * What is known of the track. `edges` holds four marks per cell (n, e, s, w): a track runs through
 * the edge, or does not. `cells` marks a cell as on the track or off it.
 */
export type State = {
  layout: Layout;
  total: number;
  edges: Mark[];
  cells: Mark[];
  bad: boolean;
};

export type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: State) => boolean;
};

export const dirOf = (side: Side) => SIDES.indexOf(side);

export function neighbour({ layout }: State, cell: number, side: Side) {
  const row = Math.floor(cell / layout.cols) + STEP[side][0];
  const col = (cell % layout.cols) + STEP[side][1];
  return row < 0 || row >= layout.rows || col < 0 || col >= layout.cols
    ? -1
    : row * layout.cols + col;
}

export function markCell(state: State, cell: number, mark: Mark) {
  const current = state.cells[cell];
  if (current === mark) return false;
  if (current !== UNKNOWN) {
    state.bad = true;
    return false;
  }
  state.cells[cell] = mark;
  return true;
}

export function markEdge(state: State, cell: number, side: Side, mark: Mark) {
  const at = cell * 4 + dirOf(side);
  const current = state.edges[at];
  if (current === mark) return false;
  if (current !== UNKNOWN) {
    state.bad = true;
    return false;
  }
  state.edges[at] = mark;
  const next = neighbour(state, cell, side);
  if (next >= 0) state.edges[next * 4 + dirOf(OPPOSITE[side])] = mark;
  if (mark === YES) {
    markCell(state, cell, YES);
    if (next >= 0) markCell(state, next, YES);
  }
  return true;
}

export function markOff(state: State, cell: number) {
  let progress = markCell(state, cell, NO);
  for (const side of SIDES) {
    progress = markEdge(state, cell, side, NO) || progress;
  }
  return progress;
}

export const edgesOf = (state: State, cell: number, mark: Mark) =>
  SIDES.filter((side) => state.edges[cell * 4 + dirOf(side)] === mark);

const lines = ({ layout: { rows, cols } }: State) => [
  ...Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => row * cols + col),
  ),
  ...Array.from({ length: cols }, (_, col) =>
    Array.from({ length: rows }, (_, row) => row * cols + col),
  ),
];

const countOf = ({ layout }: State, line: number) =>
  line < layout.rows
    ? layout.rowCounts[line]
    : layout.colCounts[line - layout.rows];

/** A row or column with all its cells on the track clears the rest; one with only as many open cells as it needs fills them. */
const lineCount: Technique = {
  name: "row and column counts",
  level: 1,
  apply(state) {
    let progress = false;
    lines(state).forEach((cells, line) => {
      const need = countOf(state, line);
      const on = cells.filter((cell) => state.cells[cell] === YES).length;
      const open = cells.filter((cell) => state.cells[cell] === UNKNOWN);
      if (on > need || on + open.length < need) {
        state.bad = true;
      } else if (on === need) {
        for (const cell of open) progress = markOff(state, cell) || progress;
      } else if (on + open.length === need) {
        for (const cell of open)
          progress = markCell(state, cell, YES) || progress;
      }
    });
    return progress;
  },
};

/** A cell on the track has two pieces of track: once two are known the rest are closed, and once only two are possible both are open. */
const continuation: Technique = {
  name: "straight on and round the bend",
  level: 1,
  apply(state) {
    let progress = false;
    for (let cell = 0; cell < state.cells.length; cell++) {
      const open = edgesOf(state, cell, YES);
      if (open.length > 2) state.bad = true;
      if (open.length === 2) {
        for (const side of edgesOf(state, cell, UNKNOWN)) {
          progress = markEdge(state, cell, side, NO) || progress;
        }
      } else if (state.cells[cell] === YES) {
        const free = SIDES.filter(
          (side) => state.edges[cell * 4 + dirOf(side)] !== NO,
        );
        if (free.length < 2) state.bad = true;
        else if (free.length === 2) {
          for (const side of free) {
            progress = markEdge(state, cell, side, YES) || progress;
          }
        }
      } else if (state.cells[cell] === NO) {
        progress = markOff(state, cell) || progress;
      }
    }
    return progress;
  },
};

/** A cell with fewer than two ways out cannot carry the track. */
const deadEnd: Technique = {
  name: "dead end",
  level: 2,
  apply(state) {
    let progress = false;
    for (let cell = 0; cell < state.cells.length; cell++) {
      if (state.cells[cell] !== UNKNOWN) continue;
      const free = SIDES.filter(
        (side) => state.edges[cell * 4 + dirOf(side)] !== NO,
      );
      if (free.length < 2) progress = markOff(state, cell) || progress;
    }
    return progress;
  },
};

/** Groups of cells joined by track, as a root per cell and the size of each group. */
export function fragments(state: State) {
  const root = Array.from({ length: state.cells.length }, (_, i) => i);
  const find = (cell: number): number =>
    root[cell] === cell ? cell : (root[cell] = find(root[cell]));
  for (let cell = 0; cell < state.cells.length; cell++) {
    for (const side of edgesOf(state, cell, YES)) {
      const next = neighbour(state, cell, side);
      if (next >= 0) root[find(cell)] = find(next);
    }
  }
  const size = new Map<number, number>();
  for (let cell = 0; cell < state.cells.length; cell++) {
    if (state.cells[cell] === YES) {
      size.set(find(cell), (size.get(find(cell)) ?? 0) + 1);
    }
  }
  return { find, size };
}

/**
 * A piece of track that would close a loop is closed, and so is a join of the entry's track to the
 * exit's while the counts still ask for track elsewhere.
 */
const connectivity: Technique = {
  name: "no loops, no early finish",
  level: 3,
  apply(state) {
    const { entry, exit, cols } = state.layout;
    const { find, size } = fragments(state);
    const entryRoot = find(entry.row * cols + entry.col);
    const exitRoot = find(exit.row * cols + exit.col);
    let progress = false;
    for (let cell = 0; cell < state.cells.length; cell++) {
      if (state.cells[cell] !== YES) continue;
      for (const side of edgesOf(state, cell, UNKNOWN)) {
        const next = neighbour(state, cell, side);
        if (next < 0 || state.cells[next] !== YES) continue;
        const a = find(cell);
        const b = find(next);
        const early =
          a !== b &&
          ((a === entryRoot && b === exitRoot) ||
            (a === exitRoot && b === entryRoot)) &&
          (size.get(a) ?? 0) + (size.get(b) ?? 0) < state.total;
        if (a === b || early) {
          progress = markEdge(state, cell, side, NO) || progress;
        }
      }
    }
    return progress;
  },
};

/**
 * The pieces of track that cross each line between two rows or two columns, with whether the two
 * ends lie on opposite sides of it.
 */
function cuts({ layout: { rows, cols, entry, exit } }: State) {
  const across = (line: number, at: (end: Cell) => number) =>
    at(entry) < line !== at(exit) < line;
  return [
    ...Array.from({ length: rows - 1 }, (_, i) => ({
      pieces: Array.from({ length: cols }, (_, col) => i * cols + col),
      side: "s" as const,
      odd: across(i + 1, (end) => end.row),
    })),
    ...Array.from({ length: cols - 1 }, (_, i) => ({
      pieces: Array.from({ length: rows }, (_, row) => row * cols + i),
      side: "e" as const,
      odd: across(i + 1, (end) => end.col),
    })),
  ];
}

/**
 * The track crosses a line between two rows (or columns) an odd number of times when the entry and
 * exit lie on opposite sides of it, and an even number when they lie on the same side. Once every
 * piece across the line but one is known, that one follows.
 */
const parity: Technique = {
  name: "crossing parity",
  level: 4,
  apply(state) {
    let progress = false;
    for (const { pieces, side, odd } of cuts(state)) {
      const at = (cell: number) => state.edges[cell * 4 + dirOf(side)];
      const open = pieces.filter((cell) => at(cell) === UNKNOWN);
      const crossings = pieces.filter((cell) => at(cell) === YES).length;
      const wrong = (crossings % 2 === 1) !== odd;
      if (open.length === 0 && wrong) state.bad = true;
      if (open.length === 1) {
        progress = markEdge(state, open[0], side, wrong ? YES : NO) || progress;
      }
    }
    return progress;
  },
};

/**
 * The cells the entry can still reach through cells and pieces of track not ruled out, without
 * passing `blocked` (a cell, or one piece of track).
 */
function reachable(state: State, blocked?: { cell: number; side?: Side }) {
  const { entry, cols } = state.layout;
  const start = entry.row * cols + entry.col;
  const seen = new Uint8Array(state.cells.length);
  const queue = [start];
  seen[start] = 1;
  const cut = (cell: number, side: Side, next: number) =>
    blocked?.side !== undefined &&
    ((cell === blocked.cell && side === blocked.side) ||
      (next === blocked.cell && OPPOSITE[side] === blocked.side));
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i];
    for (const side of SIDES) {
      const next = neighbour(state, cell, side);
      if (
        next < 0 ||
        seen[next] ||
        state.edges[cell * 4 + dirOf(side)] === NO ||
        state.cells[next] === NO ||
        (blocked?.side === undefined && next === blocked?.cell) ||
        cut(cell, side, next)
      ) {
        continue;
      }
      seen[next] = 1;
      queue.push(next);
    }
  }
  return seen;
}

const reachesTrack = (state: State, seen: Uint8Array) =>
  state.cells.every((mark, cell) => mark !== YES || seen[cell]);

/** A cell the entry can no longer reach is off the track, and the track breaks when it is on it. */
const isolated: Technique = {
  name: "cut off",
  level: 4,
  apply(state) {
    const seen = reachable(state);
    let progress = false;
    for (let cell = 0; cell < state.cells.length; cell++) {
      if (seen[cell]) continue;
      if (state.cells[cell] === YES) state.bad = true;
      else progress = markOff(state, cell) || progress;
    }
    return progress;
  },
};

/**
 * A cell or piece of track that every way from the entry to some known track passes through is on
 * the track.
 */
const bottleneck: Technique = {
  name: "bottleneck",
  level: 5,
  apply(state) {
    let progress = false;
    for (let cell = 0; cell < state.cells.length; cell++) {
      if (state.bad) return progress;
      if (
        state.cells[cell] === UNKNOWN &&
        !reachesTrack(state, reachable(state, { cell }))
      ) {
        progress = markCell(state, cell, YES) || progress;
      }
      for (const side of edgesOf(state, cell, UNKNOWN)) {
        if (neighbour(state, cell, side) < cell) continue;
        if (!reachesTrack(state, reachable(state, { cell, side }))) {
          progress = markEdge(state, cell, side, YES) || progress;
        }
      }
    }
    return progress;
  },
};

/** Every technique, easiest first. */
export const ladder: ReadonlyArray<Technique> = [
  lineCount,
  continuation,
  deadEnd,
  connectivity,
  parity,
  isolated,
  bottleneck,
];

export function propagate(state: State, maxLevel: Difficulty) {
  let again = true;
  while (again && !state.bad) {
    again = false;
    for (const technique of ladder) {
      if (technique.level <= maxLevel && technique.apply(state)) again = true;
    }
  }
  return !state.bad;
}

export const copy = (state: State): State => ({
  ...state,
  edges: [...state.edges],
  cells: [...state.cells],
});

export function stateFor(layout: Layout): State {
  const cells = layout.rows * layout.cols;
  const state: State = {
    layout,
    total: layout.rowCounts.reduce((sum, n) => sum + n, 0),
    edges: Array<Mark>(cells * 4).fill(UNKNOWN),
    cells: Array<Mark>(cells).fill(UNKNOWN),
    bad: false,
  };
  for (let cell = 0; cell < cells; cell++) {
    for (const side of SIDES) {
      if (neighbour(state, cell, side) < 0) markEdge(state, cell, side, NO);
    }
  }
  for (const { row, col, side } of [layout.entry, layout.exit]) {
    const cell = row * layout.cols + col;
    state.edges[cell * 4 + dirOf(side)] = UNKNOWN;
    markEdge(state, cell, side, YES);
  }
  for (const { row, col, piece } of layout.given) {
    const cell = row * layout.cols + col;
    const [a, b] = OPEN[piece];
    for (const side of SIDES) {
      markEdge(state, cell, side, side === a || side === b ? YES : NO);
    }
  }
  return state;
}

export const isSolved = (state: State) =>
  state.cells.every((mark) => mark !== UNKNOWN) &&
  state.edges.every((mark) => mark !== UNKNOWN);

/** The pieces of the track, read off a fully decided state. */
export function piecesOf(state: State): Placed[] {
  const { cols } = state.layout;
  return state.cells.flatMap((mark, cell) => {
    if (mark !== YES) return [];
    const [a, b] = edgesOf(state, cell, YES);
    return [
      {
        row: Math.floor(cell / cols),
        col: cell % cols,
        piece: pieceJoining(a, b),
      },
    ];
  });
}
