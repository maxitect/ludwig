import { spinSigns } from "../_shared/spin-signs";
import type { Cog, Payload } from "./schema";

export type Board = Pick<
  Payload,
  | "rows"
  | "cols"
  | "targetClockwise"
  | "driver"
  | "target"
  | "bolts"
  | "inventory"
>;
export type Placement = Cog[];
type Bolt = Board["bolts"][number];
type Peg = Pick<Cog, "row" | "col">;

export type Collision =
  | { kind: "cog"; a: Cog; b: Cog }
  | { kind: "bolt"; cog: Cog; bolt: Bolt }
  | { kind: "board"; cog: Cog };

export type Train = {
  /** Spin sign (+1 clockwise) of every cog reachable from the driver, keyed by `pegKey`. */
  signs: Record<string, 1 | -1>;
  jammed: boolean;
  unreachable: Cog[];
};

export type Rule = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Verdict = { ok: true } | { ok: false; rule: Rule };

export const radius = ({ teeth }: Pick<Cog, "teeth">) => teeth / 8;
export const pegKey = ({ row, col }: Peg) => `${row},${col}`;
const dist2 = (a: Peg, b: Peg) => (a.row - b.row) ** 2 + (a.col - b.col) ** 2;

/** Two cogs mesh when their pitch circles touch exactly. */
export const meshes = (a: Cog, b: Cog) =>
  dist2(a, b) === (radius(a) + radius(b)) ** 2;

const overlaps = (a: Cog, b: Cog) => dist2(a, b) < (radius(a) + radius(b)) ** 2;

const hitsBolt = (cog: Cog, bolt: Bolt) => dist2(cog, bolt) <= radius(cog) ** 2;

const offBoard = ({ rows, cols }: Board, cog: Cog) => {
  const r = radius(cog);
  return (
    cog.row < r ||
    cog.row > rows - 1 - r ||
    cog.col < r ||
    cog.col > cols - 1 - r
  );
};

const cogsOf = (board: Board, placement: Placement) => [
  board.driver,
  board.target,
  ...placement,
];

/** Every cog pair that overlaps, every cog on a bolt and every disc off the board, the fixed cogs included. */
export function collisions(board: Board, placement: Placement): Collision[] {
  const cogs = cogsOf(board, placement);
  const found: Collision[] = [];
  cogs.forEach((a, i) => {
    for (const b of cogs.slice(i + 1)) {
      if (overlaps(a, b)) found.push({ kind: "cog", a, b });
    }
    for (const bolt of board.bolts) {
      if (hitsBolt(a, bolt)) found.push({ kind: "bolt", cog: a, bolt });
    }
    if (offBoard(board, a)) found.push({ kind: "board", cog: a });
  });
  return found;
}

export function reachableFrom(start: Cog, cogs: Cog[]) {
  const seen = new Map<string, Cog>([[pegKey(start), start]]);
  const queue = [start];
  for (const current of queue) {
    for (const other of cogs) {
      if (!seen.has(pegKey(other)) && meshes(current, other)) {
        seen.set(pegKey(other), other);
        queue.push(other);
      }
    }
  }
  return seen;
}

/** Spin signs, jam and reachability of the mesh graph over the driver, the target and the placement. */
export function trainOf(board: Board, placement: Placement): Train {
  const cogs = cogsOf(board, placement);
  const reached = reachableFrom(board.driver, cogs);
  const connected = [...reached.values()];
  const edges = connected.flatMap((a, i) =>
    connected
      .slice(i + 1)
      .filter((b) => meshes(a, b))
      .map((b) => ({ gearAId: pegKey(a), gearBId: pegKey(b) })),
  );
  const result = spinSigns(
    connected.map((cog) => ({ id: pegKey(cog) })),
    edges,
    pegKey(board.driver),
  );
  return {
    signs: result.ok ? result.signs : {},
    jammed: !result.ok,
    unreachable: cogs.filter((cog) => !reached.has(pegKey(cog))),
  };
}

function targetNeeded(board: Board, placement: Placement) {
  const cogs = cogsOf(board, placement);
  return placement.every((removed) => {
    const rest = cogs.filter((cog) => cog !== removed);
    return !reachableFrom(board.driver, rest).has(pegKey(board.target));
  });
}

/** The first of rules 1 to 7 of SPEC 5.2.5 that the placement breaks. */
export function validate(board: Board, placement: Placement): Verdict {
  const fixed = [board.driver, board.target];
  const pegs = [...fixed, ...placement].map(pegKey);
  const bolts = new Set(board.bolts.map(pegKey));
  if (
    new Set(pegs).size !== pegs.length ||
    placement.some((cog) => bolts.has(pegKey(cog)))
  ) {
    return { ok: false, rule: 1 };
  }
  const used = new Map<Cog["teeth"], number>();
  for (const { teeth } of placement)
    used.set(teeth, (used.get(teeth) ?? 0) + 1);
  const stocked = new Map(board.inventory.map((i) => [i.teeth, i.count]));
  if ([...used].some(([teeth, n]) => n > (stocked.get(teeth) ?? 0))) {
    return { ok: false, rule: 2 };
  }
  if (collisions(board, placement).length) return { ok: false, rule: 3 };
  const train = trainOf(board, placement);
  if (train.unreachable.length) return { ok: false, rule: 4 };
  if (train.jammed) return { ok: false, rule: 5 };
  const required = board.targetClockwise ? 1 : -1;
  if (train.signs[pegKey(board.target)] !== required) {
    return { ok: false, rule: 6 };
  }
  if (!targetNeeded(board, placement)) return { ok: false, rule: 7 };
  return { ok: true };
}

const sorted = (placement: Placement) =>
  placement
    .map(({ row, col, teeth }) => `${row},${col},${teeth}`)
    .sort()
    .join(";");

/** Placements are sets keyed by peg, so the order cogs were placed in does not matter. */
export const samePlacement = (a: Placement, b: Placement) =>
  a.length === b.length && sorted(a) === sorted(b);

/**
 * Depth-first search over induced paths from the driver: each new cog meshes only the chain's
 * last cog, until one meshes the target. Returns at most `cap` placements.
 */
export function solve(board: Board, cap = 2): Placement[] {
  const { driver, target } = board;
  if (collisions(board, []).length) return [];
  const required = board.targetClockwise ? 1 : -1;
  if (meshes(driver, target)) return required === -1 ? [[]] : [];

  const found: Placement[] = [];
  const stock = new Map(board.inventory.map((i) => [i.teeth, i.count]));

  const extend = (chain: Placement, end: Cog) => {
    const sign = chain.length % 2 === 0 ? -1 : 1;
    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        for (const [teeth, left] of stock) {
          if (found.length >= cap) return;
          const next = { row, col, teeth };
          if (left < 1 || !meshes(end, next) || offBoard(board, next)) continue;
          if (board.bolts.some((bolt) => hitsBolt(next, bolt))) continue;
          const others = [driver, ...chain].filter((cog) => cog !== end);
          if (
            others.some(
              (cog) => dist2(cog, next) <= (radius(cog) + radius(next)) ** 2,
            )
          ) {
            continue;
          }
          if (overlaps(next, target)) continue;
          const path = [...chain, next];
          if (meshes(next, target)) {
            if (-sign === required) found.push(path);
            continue;
          }
          stock.set(teeth, left - 1);
          extend(path, next);
          stock.set(teeth, left);
        }
      }
    }
  };
  extend([], driver);
  return found;
}
