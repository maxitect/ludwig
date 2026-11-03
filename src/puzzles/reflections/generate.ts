import {
  type Difficulty,
  generateGraded,
  type GeneratorVersions,
  shuffle,
} from "../_shared/generate/pipeline";
import { countSolutions, portKey, trace } from "./engine";
import { solveLayout } from "./grade";
import type { Content, Mirror, PortRef } from "./schema";

const MAX_CANDIDATES = 8000;
const MIN_SLOTS = 2;
const MAX_SLOTS = 16;
const MIN_PAIRS = 2;

/** Grid sides that grow with the difficulty. */
const sizesFor = (difficulty: Difficulty): ReadonlyArray<number> => {
  switch (difficulty) {
    case 1:
      return [4, 5];
    case 2:
      return [5, 6];
    case 3:
      return [6, 7];
    case 4:
      return [7, 8, 9];
    case 5:
      return [8, 9, 10];
  }
};

/** The share of cells that are slots at the start, before slots are fixed to make the puzzle unique. */
const slotShareFor = (difficulty: Difficulty) => 0.1 + 0.03 * difficulty;

type Planted = {
  rows: number;
  cols: number;
  mirrors: ReadonlyArray<Mirror | null>;
};

type Pair = { a: PortRef; b: PortRef };

function edgePorts({ rows, cols }: Planted): PortRef[] {
  return [
    ...Array.from({ length: cols }, (_, offset) => ({
      side: "n" as const,
      offset,
    })),
    ...Array.from({ length: rows }, (_, offset) => ({
      side: "e" as const,
      offset,
    })),
    ...Array.from({ length: cols }, (_, offset) => ({
      side: "s" as const,
      offset,
    })),
    ...Array.from({ length: rows }, (_, offset) => ({
      side: "w" as const,
      offset,
    })),
  ];
}

/** Every pair of edge ports the planted mirrors join, each pair once. */
function joinedPairs(planted: Planted): Pair[] {
  const { rows, cols, mirrors } = planted;
  const layout = {
    rows,
    cols,
    fixedMirrors: mirrors.flatMap((mirror, index) =>
      mirror
        ? [{ row: Math.floor(index / cols), col: index % cols, mirror }]
        : [],
    ),
    slots: [],
    ports: [],
  };
  const seen = new Set<string>();
  const pairs: Pair[] = [];
  for (const port of edgePorts(planted)) {
    if (seen.has(portKey(port))) continue;
    const { exit } = trace(layout, [], port);
    seen.add(portKey(port));
    seen.add(portKey(exit));
    pairs.push({ a: port, b: exit });
  }
  return pairs;
}

function toContent(
  { rows, cols, mirrors }: Planted,
  slots: ReadonlySet<number>,
  pairs: ReadonlyArray<Pair>,
): Content {
  const at = (index: number) => ({
    row: Math.floor(index / cols),
    col: index % cols,
  });
  const order = ["n", "e", "s", "w"];
  const first = (pair: Pair) =>
    Math.min(
      order.indexOf(pair.a.side) * 100 + pair.a.offset,
      order.indexOf(pair.b.side) * 100 + pair.b.offset,
    );
  const ordered = pairs.toSorted((x, y) => first(x) - first(y));
  return {
    rows,
    cols,
    fixedMirrors: mirrors.flatMap((mirror, index) =>
      mirror && !slots.has(index) ? [{ ...at(index), mirror }] : [],
    ),
    slots: mirrors.flatMap((_, index) => (slots.has(index) ? [at(index)] : [])),
    ports: ordered.flatMap(({ a, b }, index) => {
      const label = String.fromCharCode(65 + index);
      return [
        { ...a, label },
        { ...b, label },
      ];
    }),
  };
}

/**
 * Version 1: random mirrors are planted and some cells made slots; every pair of edge ports the
 * mirrors join is lettered. Slots are fixed back to their mirror until the puzzle is unique, then
 * letters are dropped one pair at a time while it stays unique and the techniques up to the target
 * difficulty still solve it. The grader gives the difficulty.
 */
function generateV1(seed: string, difficulty: Difficulty) {
  const sizes = sizesFor(difficulty);
  return generateGraded(seed, difficulty, MAX_CANDIDATES, (rng) => {
    const rows = sizes[Math.floor(rng() * sizes.length)];
    const cols = sizes[Math.floor(rng() * sizes.length)];
    const density = 0.3 + 0.2 * rng();
    const mirrors = Array.from({ length: rows * cols }, () =>
      rng() < density ? (rng() < 0.5 ? "slash" : "backslash") : null,
    );
    const planted: Planted = { rows, cols, mirrors };
    const mirrored = mirrors.flatMap((m, index) => (m ? [index] : []));
    const target = Math.min(
      MAX_SLOTS,
      Math.round(rows * cols * slotShareFor(difficulty)),
    );
    const slots = new Set(shuffle(rng, mirrored).slice(0, target));
    if (slots.size < MIN_SLOTS) return null;
    let pairs = joinedPairs(planted);
    if (pairs.length > 26) return null;
    while (countSolutions(toContent(planted, slots, pairs), 2) !== 1) {
      const [fix] = shuffle(rng, [...slots]);
      slots.delete(fix);
      if (slots.size < MIN_SLOTS) return null;
    }
    const holds = (nextSlots: ReadonlySet<number>, nextPairs: Pair[]) => {
      const content = toContent(planted, nextSlots, nextPairs);
      return (
        countSolutions(content, 2) === 1 &&
        !!solveLayout(content, difficulty)?.grade
      );
    };
    for (let changed = true; changed;) {
      changed = false;
      for (const pair of shuffle(rng, pairs)) {
        if (pairs.length <= MIN_PAIRS) break;
        const fewer = pairs.filter((other) => other !== pair);
        if (!holds(slots, fewer)) continue;
        pairs = fewer;
        changed = true;
      }
      for (const index of shuffle(rng, mirrored)) {
        if (slots.has(index) || slots.size >= MAX_SLOTS) continue;
        const more = new Set(slots).add(index);
        if (!holds(more, pairs)) continue;
        slots.add(index);
        changed = true;
      }
    }
    const content = toContent(planted, slots, pairs);
    const grade = solveLayout(content)?.grade;
    return grade && grade.difficulty === difficulty
      ? { content, difficulty: grade.difficulty }
      : null;
  });
}

/** Each version pins one generator. Never edit an entry: add a new version instead. */
export const reflectionsGenerators: GeneratorVersions<Content> = {
  1: generateV1,
};
