import { OPEN, OPPOSITE, STEP, otherSide, pieceJoining } from "./geometry";
import {
  type State,
  UNKNOWN,
  YES,
  NO,
  copy,
  edgesOf,
  fragments,
  markEdge,
  piecesOf,
  stateFor,
} from "./propagate";
import { deduce } from "./grade";
import type { Cell, Payload, Piece, Placed, Side } from "./schema";

/** The clues and ends a track must satisfy. */
export type Layout = Pick<
  Payload,
  "rows" | "cols" | "entry" | "exit" | "rowCounts" | "colCounts" | "given"
>;

export {
  OPEN,
  OPPOSITE,
  SIDES,
  STEP,
  otherSide,
  pieceJoining,
} from "./geometry";

/** True when the end sits inside the grid, on the edge its side names. */
export function endOnEdge(
  { row, col, side }: Cell & { side: Side },
  rows: number,
  cols: number,
) {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return false;
  switch (side) {
    case "n":
      return row === 0;
    case "s":
      return row === rows - 1;
    case "w":
      return col === 0;
    case "e":
      return col === cols - 1;
  }
}

export const indexOf = (cols: number, { row, col }: Cell) => row * cols + col;
export const cellAt = (cols: number, index: number): Cell => ({
  row: Math.floor(index / cols),
  col: index % cols,
});

/** The pieces that sit inside the grid, one per cell (the last one listed wins), by cell index. */
export function pieceMap(
  { rows, cols }: Pick<Layout, "rows" | "cols">,
  pieces: readonly Placed[],
) {
  const map = new Map<number, Piece>();
  for (const { row, col, piece } of pieces) {
    if (row < rows && col < cols) map.set(row * cols + col, piece);
  }
  return map;
}

/**
 * Follows the track from the entry. `path` is every cell it passes, in order. It `reachesExit` when
 * it leaves the grid through the exit's side. `breakAt` is the last cell of a track that stops
 * short: no piece beyond it, a piece that does not join it, or the edge of the grid. `strays` are
 * pieces off the path, and `branches` are the path cells a stray piece opens onto.
 */
export function trace(layout: Layout, pieces: readonly Placed[]) {
  const { rows, cols, entry, exit } = layout;
  const map = pieceMap(layout, pieces);
  const path: Cell[] = [];
  const seen = new Set<number>();
  let reachesExit = false;
  let breakAt: Cell | null = null;

  let at = indexOf(cols, entry);
  let from: Side = entry.side;
  for (;;) {
    const here = cellAt(cols, at);
    const piece = map.get(at);
    const out = piece && !seen.has(at) ? otherSide(piece, from) : undefined;
    if (!out) {
      breakAt = path.at(-1) ?? here;
      break;
    }
    seen.add(at);
    path.push(here);
    if (at === indexOf(cols, exit) && out === exit.side) {
      reachesExit = true;
      break;
    }
    const [dr, dc] = STEP[out];
    const row = here.row + dr;
    const col = here.col + dc;
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      breakAt = here;
      break;
    }
    at = row * cols + col;
    from = OPPOSITE[out];
  }

  const strays = [...map.keys()]
    .filter((index) => !seen.has(index))
    .sort((a, b) => a - b)
    .map((index) => cellAt(cols, index));
  const branches = new Set<number>();
  for (const { row, col } of strays) {
    for (const side of OPEN[map.get(row * cols + col)!]) {
      const [dr, dc] = STEP[side];
      const next = (row + dr) * cols + col + dc;
      if (
        row + dr >= 0 &&
        row + dr < rows &&
        col + dc >= 0 &&
        col + dc < cols &&
        seen.has(next)
      ) {
        branches.add(next);
      }
    }
  }
  return {
    path,
    reachesExit,
    breakAt,
    strays,
    branches: [...branches].sort((a, b) => a - b).map((i) => cellAt(cols, i)),
  };
}

/**
 * Walks every track from the entry that obeys the counts and the given pieces, calling `found`
 * with each. It decides one piece of track at a time, in both ways, after the techniques of
 * `propagate.ts` have drawn every conclusion they can.
 */
function search(layout: Layout, found: (track: Placed[]) => boolean) {
  const { cols, entry, exit, rowCounts, colCounts } = layout;
  if (sum(rowCounts) !== sum(colCounts)) return;
  let stopped = false;

  function walk(state: State) {
    if (!deduce(state, 4)) return;
    let cell = -1;
    let side: Side | undefined;
    for (let at = 0; at < state.cells.length && cell < 0; at++) {
      const open = edgesOf(state, at, UNKNOWN);
      if (open.length) {
        cell = at;
        side = open[0];
        if (state.cells[at] !== YES) cell = -1;
      }
    }
    if (cell < 0) {
      for (let at = 0; at < state.cells.length && cell < 0; at++) {
        const open = edgesOf(state, at, UNKNOWN);
        if (open.length) {
          cell = at;
          side = open[0];
        }
      }
    }
    if (cell < 0 || !side) {
      const { find } = fragments(state);
      const root = find(indexOf(cols, entry));
      const joined = state.cells.every(
        (mark, at) => mark !== YES || find(at) === root,
      );
      if (joined && find(indexOf(cols, exit)) === root) {
        const ordered = trace(layout, piecesOf(state)).path;
        const pieces = new Map(
          piecesOf(state).map((placed) => [indexOf(cols, placed), placed]),
        );
        stopped = found(ordered.map((at) => pieces.get(indexOf(cols, at))!));
      }
      return;
    }
    for (const mark of [YES, NO] as const) {
      if (stopped) return;
      const trial = copy(state);
      markEdge(trial, cell, side, mark);
      if (!trial.bad) walk(trial);
    }
  }

  walk(stateFor(layout));
}

const sum = (counts: readonly number[]) => counts.reduce((a, b) => a + b, 0);

/** How many tracks satisfy the layout, stopping once `limit` are found. */
export function countSolutions(layout: Layout, limit = 2) {
  let count = 0;
  search(layout, () => ++count >= limit);
  return count;
}

/** One track that satisfies the layout, or null when there is none. */
export function solve(layout: Layout) {
  let first: Placed[] | null = null;
  search(layout, (track) => {
    first = [...track];
    return true;
  });
  return first as Placed[] | null;
}

const sideBetween = (a: Cell, b: Cell): Side =>
  b.row < a.row ? "n" : b.row > a.row ? "s" : b.col > a.col ? "e" : "w";

/**
 * The pieces a drag along `path` (adjacent cells, in order) lays. Each cell joins the side it was
 * entered from to the side it was left by. A track end that ends on the entry or exit turns to
 * that end's light. The first cell joins `startFrom` when given (the track the drag resumes); any
 * other end carries straight on.
 */
export function laidAlong(
  { entry, exit }: Pick<Layout, "entry" | "exit">,
  path: readonly Cell[],
  startFrom?: Side,
): Placed[] {
  const at = (cell: Cell, end: Layout["entry"]) =>
    cell.row === end.row && cell.col === end.col;
  return path.map((cell, i) => {
    const next = path[i + 1];
    const last = i === path.length - 1;
    const lit = [entry, exit].find((end) => at(cell, end));
    let from: Side = i
      ? OPPOSITE[sideBetween(path[i - 1], cell)]
      : (lit?.side ?? startFrom ?? OPPOSITE[sideBetween(cell, next)]);
    let out: Side = last ? OPPOSITE[from] : sideBetween(cell, next);
    if (last && lit && lit.side !== from) out = lit.side;
    if (from === out) from = OPPOSITE[out];
    return { ...cell, piece: pieceJoining(from, out) };
  });
}

/** The counts a set of pieces gives: the written puzzle's clues, derived from its track. */
export function countsOf(
  { rows, cols }: Pick<Layout, "rows" | "cols">,
  pieces: readonly Cell[],
) {
  const rowCounts = new Array<number>(rows).fill(0);
  const colCounts = new Array<number>(cols).fill(0);
  for (const { row, col } of pieces) {
    rowCounts[row]++;
    colCounts[col]++;
  }
  return { rowCounts, colCounts };
}
