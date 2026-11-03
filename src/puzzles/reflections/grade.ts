import type { Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import { follow, type Layout, pairsOf, portKey } from "./engine";
import type { Content, Mirror, Placed, PortRef } from "./schema";

const MIRRORS: readonly Mirror[] = ["slash", "backslash"];

type Assignment = Map<number, Mirror>;

type Context = {
  layout: Layout;
  fixed: ReadonlyMap<number, Mirror>;
  slots: ReadonlySet<number>;
  pairs: ReturnType<typeof pairsOf>;
  decided: Assignment;
};

type Technique = {
  name: string;
  level: Difficulty;
  apply: (context: Context) => boolean;
};

/** Thrown when a deduction meets a rule it cannot satisfy: the puzzle is not solvable as written. */
class Broken extends Error {}

const indexOf = ({ cols }: Layout, row: number, col: number) =>
  row * cols + col;

/** What a cell holds: a mirror, nothing (open floor), or null for a slot nothing has decided yet. */
function mirrorAt(
  context: Context,
  extra: Assignment,
  row: number,
  col: number,
) {
  const index = indexOf(context.layout, row, col);
  const mirror =
    context.fixed.get(index) ?? context.decided.get(index) ?? extra.get(index);
  if (mirror || !context.slots.has(index)) return mirror;
  return null;
}

/**
 * Every way the slots on the beam from `from` can be set so that it leaves by `to`, looking at most
 * `limit` undecided slots ahead and counting `base` as set. A way that goes on past `limit` is kept
 * as it stands: it might still work. A beam that leaves anywhere else is dropped.
 */
function ways(
  context: Context,
  from: PortRef,
  to: PortRef,
  limit: number,
  base: Assignment = new Map(),
) {
  const assign = new Map(base);
  const found: Assignment[] = [];
  const search = (depth: number) => {
    let open = -1;
    const exit = follow(
      context.layout,
      (row, col) => {
        const mirror = mirrorAt(context, assign, row, col);
        if (mirror === null) open = indexOf(context.layout, row, col);
        return mirror;
      },
      from,
    );
    if (exit) {
      if (portKey(exit) === portKey(to)) found.push(new Map(assign));
      return;
    }
    if (depth === limit) {
      found.push(new Map(assign));
      return;
    }
    for (const mirror of MIRRORS) {
      assign.set(open, mirror);
      search(depth + 1);
    }
    assign.delete(open);
  };
  search(0);
  return found;
}

const undecided = ({ slots, decided }: Context) =>
  [...slots].filter((index) => !decided.has(index));

/**
 * Decides every slot that all the ways of one beam agree on: each way sets it, and to the same
 * mirror. A beam with no way left cannot be joined, so the puzzle is broken.
 */
function agreed(context: Context, beam: Assignment[]) {
  if (!beam.length) throw new Broken();
  let progress = false;
  for (const index of undecided(context)) {
    const first = beam[0].get(index);
    if (first && beam.every((way) => way.get(index) === first)) {
      context.decided.set(index, first);
      progress = true;
    }
  }
  return progress;
}

/**
 * Looks along each lettered beam, from both ends, at the ways its next `limit` undecided slots can
 * be set so that it reaches its partner. A slot that every way sets the same is decided.
 */
const along = (name: string, level: Difficulty, limit: number): Technique => ({
  name,
  level,
  apply: (context) => {
    let progress = false;
    for (const { a, b } of context.pairs) {
      for (const [from, to] of [
        [a, b],
        [b, a],
      ]) {
        progress = agreed(context, ways(context, from, to, limit)) || progress;
      }
    }
    return progress;
  },
});

const BLOCKED_LIMIT = 6;

/**
 * A mirror in a slot that leaves some lettered beam no way at all to reach its partner cannot
 * go there, so the slot takes the other mirror. Each mirror is checked on the spot, with nothing
 * else assumed.
 */
const blockedBeam: Technique = {
  name: "blocked beam",
  level: 5,
  apply: (context) => {
    for (const index of undecided(context)) {
      const blocked = MIRRORS.filter((mirror) =>
        context.pairs.some(
          ({ a, b }) =>
            !ways(context, a, b, BLOCKED_LIMIT, new Map([[index, mirror]]))
              .length,
        ),
      );
      if (blocked.length === MIRRORS.length) throw new Broken();
      if (blocked.length === 1) {
        context.decided.set(
          index,
          blocked[0] === "slash" ? "backslash" : "slash",
        );
        return true;
      }
    }
    return false;
  },
};

const ladder: readonly Technique[] = [
  along("beam forcing", 1, 1),
  along("two slots on a beam", 2, 2),
  along("three slots on a beam", 3, 3),
  along("five slots on a beam", 4, 5),
  blockedBeam,
];

/**
 * Runs the ladder up to `maxLevel`, easiest technique first, restarting from the easiest after each
 * success. The grade is null when the techniques stall short of every slot, and the whole result is
 * null when a rule broke.
 */
export function solveLayout(layout: Layout, maxLevel: Difficulty = 5) {
  const context: Context = {
    layout,
    fixed: new Map(
      layout.fixedMirrors.map(({ row, col, mirror }) => [
        indexOf(layout, row, col),
        mirror,
      ]),
    ),
    slots: new Set(
      layout.slots.map(({ row, col }) => indexOf(layout, row, col)),
    ),
    pairs: pairsOf(layout),
    decided: new Map(),
  };
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  try {
    while (undecided(context).length) {
      const next = ladder.find(
        (technique) => technique.level <= maxLevel && technique.apply(context),
      );
      if (!next) break;
      uses[next.name] = (uses[next.name] ?? 0) + 1;
      if (next.level > hardest.level) hardest = next;
    }
  } catch (error) {
    if (error instanceof Broken) return null;
    throw error;
  }
  const solved = !undecided(context).length;
  const grade: Grade | null = solved
    ? { difficulty: hardest.level, hardest: hardest.name, uses }
    : null;
  const mirrors: Placed[] | null = solved
    ? layout.slots.map(({ row, col }) => ({
        row,
        col,
        mirror: context.decided.get(indexOf(layout, row, col))!,
      }))
    : null;
  return { grade, mirrors };
}

/**
 * Grades a reflections puzzle by technique alone. The grade and mirrors are null when the
 * techniques up to `maxLevel` cannot decide every slot, which is what a puzzle that needs trial
 * and error looks like. Null when a rule broke.
 */
export const solveReflections = (content: Content, maxLevel?: Difficulty) =>
  solveLayout(content, maxLevel);

export const gradeReflections = (content: Content, maxLevel?: Difficulty) =>
  solveReflections(content, maxLevel)?.grade ?? null;
