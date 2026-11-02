import type { Cell, Content, Mirror, Placed, PortRef, Side } from "./schema";

/** The puzzle a beam travels through: the grid, its fixed mirrors, the slots and the lettered ports. */
export type Layout = Pick<
  Content,
  "rows" | "cols" | "fixedMirrors" | "slots" | "ports"
>;

/** A cell the beam enters and the way it is travelling when it does. */
export type Step = Cell & { heading: Side };

export const SIDES: readonly Side[] = ["n", "e", "s", "w"];

/** The `[row, col]` change of one step in each heading. */
export const STEP: Readonly<Record<Side, readonly [number, number]>> = {
  n: [-1, 0],
  e: [0, 1],
  s: [1, 0],
  w: [0, -1],
};

export const OPPOSITE: Readonly<Record<Side, Side>> = {
  n: "s",
  e: "w",
  s: "n",
  w: "e",
};

/** A beam that meets a mirror turns: `/` sends east to north, `\` sends east to south. */
const TURN: Readonly<Record<Mirror, Readonly<Record<Side, Side>>>> = {
  slash: { e: "n", n: "e", w: "s", s: "w" },
  backslash: { e: "s", s: "e", w: "n", n: "w" },
};

export const portKey = ({ side, offset }: PortRef) => `${side}${offset}`;

/** The cell a port opens onto and the way a beam entering there travels. */
export function entryOf(
  { rows, cols }: Pick<Layout, "rows" | "cols">,
  { side, offset }: PortRef,
): Step {
  switch (side) {
    case "n":
      return { row: 0, col: offset, heading: "s" };
    case "s":
      return { row: rows - 1, col: offset, heading: "n" };
    case "w":
      return { row: offset, col: 0, heading: "e" };
    case "e":
      return { row: offset, col: cols - 1, heading: "w" };
  }
}

/** True when the port sits on a real edge cell of the grid. */
export function portOnEdge(
  { rows, cols }: Pick<Layout, "rows" | "cols">,
  { side, offset }: PortRef,
) {
  const length = side === "n" || side === "s" ? cols : rows;
  return Number.isInteger(offset) && offset >= 0 && offset < length;
}

/** The mirror in each cell by index. Fixed mirrors win over a placed one in the same cell. */
function mirrorMap(
  { cols, fixedMirrors }: Pick<Layout, "cols" | "fixedMirrors">,
  placed: readonly Placed[],
) {
  const map = new Map<number, Mirror>();
  for (const { row, col, mirror } of placed) map.set(row * cols + col, mirror);
  for (const { row, col, mirror } of fixedMirrors) {
    map.set(row * cols + col, mirror);
  }
  return map;
}

/**
 * Walks the beam that enters at `port`, asking `mirrorAt` what each cell holds: a mirror, nothing,
 * or null when that is not known yet, which stops the walk. Returns the port the beam leaves by, or
 * null when it was stopped. Mirrors are reversible, so a beam from an edge can never loop.
 */
function follow(
  layout: Pick<Layout, "rows" | "cols">,
  mirrorAt: (row: number, col: number) => Mirror | undefined | null,
  port: PortRef,
  visit?: (step: Step) => void,
): PortRef | null {
  const { rows, cols } = layout;
  let step = entryOf(layout, port);
  for (;;) {
    visit?.(step);
    const mirror = mirrorAt(step.row, step.col);
    if (mirror === null) return null;
    const heading = mirror ? TURN[mirror][step.heading] : step.heading;
    const [dr, dc] = STEP[heading];
    const row = step.row + dr;
    const col = step.col + dc;
    if (row < 0 || row >= rows || col < 0 || col >= cols) {
      return heading === "n" || heading === "s"
        ? { side: heading, offset: step.col }
        : { side: heading, offset: step.row };
    }
    step = { row, col, heading };
  }
}

/**
 * Follows the beam that enters at `port` through the fixed mirrors and the placed `mirrors`. A slot
 * with no mirror is open floor. `path` lists every cell the beam enters in order with its heading on
 * entry, so a cell crossed twice appears twice. `exit` is the port it leaves by, which can be
 * `port` itself.
 */
export function trace(
  layout: Layout,
  mirrors: readonly Placed[],
  port: PortRef,
) {
  const map = mirrorMap(layout, mirrors);
  const path: Step[] = [];
  const exit = follow(
    layout,
    (row, col) => map.get(row * layout.cols + col),
    port,
    (step) => path.push(step),
  );
  return { path, exit: exit! };
}

export type Pair = { label: string; a: PortRef; b: PortRef };

/** The lettered ports grouped by letter, in letter order. A letter without exactly two ports is left out. */
export function pairsOf({ ports }: Pick<Layout, "ports">): Pair[] {
  const byLabel = new Map<string, PortRef[]>();
  for (const { label, side, offset } of ports) {
    byLabel.set(label, [...(byLabel.get(label) ?? []), { side, offset }]);
  }
  return [...byLabel]
    .filter(([, group]) => group.length === 2)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, [a, b]]) => ({ label, a, b }));
}

/** The lettered ports whose beam does not leave by the other port of its letter. */
export function unmatchedPorts(layout: Layout, mirrors: readonly Placed[]) {
  const lost: PortRef[] = [];
  for (const { a, b } of pairsOf(layout)) {
    if (portKey(trace(layout, mirrors, a).exit) !== portKey(b)) lost.push(a, b);
  }
  return lost;
}

const MIRRORS: readonly Mirror[] = ["slash", "backslash"];

/**
 * Every way of putting one mirror in each slot that joins all the lettered pairs, up to `limit`
 * (all of them when omitted). Slots are filled in reading order. After each choice the beam from one
 * port of every pair is followed until it leaves or reaches a slot still empty, and the branch is
 * dropped as soon as a beam leaves anywhere but its partner.
 */
export function solutions(layout: Layout, limit = Infinity): Placed[][] {
  const { cols } = layout;
  const slots = [...layout.slots].sort(
    (a, b) => a.row - b.row || a.col - b.col,
  );
  const fixed = mirrorMap(layout, []);
  const open = new Set(slots.map(({ row, col }) => row * cols + col));
  const pairs = pairsOf(layout);
  const chosen = new Map<number, Mirror>();

  const mirrorAt = (row: number, col: number) => {
    const index = row * cols + col;
    const mirror = fixed.get(index);
    if (mirror || !open.has(index)) return mirror;
    return chosen.get(index) ?? null;
  };
  const consistent = () =>
    pairs.every(({ a, b }) => {
      const exit = follow(layout, mirrorAt, a);
      return exit === null || portKey(exit) === portKey(b);
    });

  const found: Placed[][] = [];
  const search = (at: number) => {
    if (found.length >= limit) return;
    if (at === slots.length) {
      found.push(
        slots.map(({ row, col }) => ({
          row,
          col,
          mirror: chosen.get(row * cols + col)!,
        })),
      );
      return;
    }
    const index = slots[at].row * cols + slots[at].col;
    for (const mirror of MIRRORS) {
      chosen.set(index, mirror);
      if (consistent()) search(at + 1);
    }
    chosen.delete(index);
  };
  search(0);
  return found;
}

/** How many solutions the puzzle has, counting no further than `cap`. */
export function countSolutions(layout: Layout, cap = 2) {
  return solutions(layout, cap).length;
}

/** The first solution found, or null when the puzzle has none. */
export function solve(layout: Layout) {
  return solutions(layout, 1)[0] ?? null;
}
