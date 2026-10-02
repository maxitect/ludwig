/**
 * Seeded generators for the gear puzzle (SPEC 5.2.3).
 *
 * Why a constructive method. Under SPEC 5.2.2 a gear's sightline pattern depends only on its
 * teeth, its spin sign and one phase. A random diagram has a win (exactly one gear sees) at about
 * a third of the crank/figure cells, so "randomise, then accept if unique" never accepts.
 * Instead, the generator plants one win and covers every other moment where the killer would
 * be alone:
 *
 *   1. Plant. Draw the killer K and one moment p where it sees.
 *   2. Cover. Split the other gears into twin groups of 2 or 3. Twins have equal teeth, the same
 *      spin sign (same slot parity) and offsets aligned to their slot difference, so their
 *      sightline pattern is identical: the bearings of every gear shift by the same amount each
 *      figure, hence twins stay in sync. A group of twins is never alone, so a win can only be
 *      K seeing while no group sees. Groups are chosen greedily to cover the moments where K
 *      sees, never covering p.
 *   3. Local search. While uncovered moments remain, re-draw one group at a time, keeping the
 *      change when it uncovers fewer moments.
 *   4. Gate. The diagram is accepted only when the brute-force `solveAll` finds exactly one win.
 *
 * Fix the Diagram variants swap the starting slots of K disjoint pairs of a unique diagram so that
 * the printed diagram has no win. The variant is accepted only when that swap set is the unique
 * repair among all sets of at most K disjoint swaps (`repairsOf`).
 *
 * Twins: gears of T teeth are twins when their slots differ by a multiple of
 * lcm(2, S / gcd(S, T)), which keeps the offset an integer and the spin sign equal.
 *
 * Meshing rule ("ring plus chords"). Gears sit on distinct starting slots and the spin sign is the
 * slot parity, so every mesh joins slots an odd number apart. A mesh is a ring edge when the two
 * slots are adjacent on the ring (cyclically), otherwise a chord. Chords never cross each other,
 * and only as many chords are added as it takes to connect the gears, shortest first.
 *
 * Seeds are strings such as '2026-11-01'; `hashSeed` turns them into a uint32 for mulberry32.
 */
import { hashSeed, mulberry32 } from "../_shared/prng";
import { type Diagram, lcmTeeth, solveAll, spinSigns } from "./engine";
import {
  countBits,
  loneBits,
  type Mask,
  maskWords,
  phaseOf,
  seesMask,
} from "./masks";
import { type Difficulty, presets } from "./presets";
import type { Content, Solution } from "./schema";

type Gear = Diagram["gears"][number];
type Draft = Pick<Gear, "teeth" | "startSlot" | "initialOffset">;
type Rand = () => number;
type Swaps = Solution["swaps"];

const MAX_ATTEMPTS = 2000;
const CANDIDATES_PER_GROUP = 12;
const POLISH_ROUNDS = 24;
const MAX_VARIANT_DIAGRAMS = 5000;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const below = (rand: Rand, n: number) => Math.floor(rand() * n);
const pick = <T>(rand: Rand, items: readonly T[]) =>
  items[below(rand, items.length)]!;
const between = (rand: Rand, { min, max }: { min: number; max: number }) =>
  min + below(rand, max - min + 1);
const signAt = (slot: number): 1 | -1 => (slot % 2 === 0 ? 1 : -1);

function shuffle<T>(rand: Rand, items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = below(rand, i + 1);
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

/** The diagram the engine and the checkers see: gear ids are the content labels. */
export function diagramOf(content: Content): Diagram {
  return {
    slotCount: content.slotCount,
    mIn: content.mIn,
    mOut: content.mOut,
    gears: content.gears.map((gear) => ({ ...gear, id: gear.label })),
    meshes: content.meshes.map(({ a, b }) => ({ gearAId: a, gearBId: b })),
  };
}

const orderedPair = (a: string, b: string) =>
  a < b ? { gearAId: a, gearBId: b } : { gearAId: b, gearBId: a };

export function applySwaps(diagram: Diagram, swaps: Swaps): Diagram {
  const slots = new Map(diagram.gears.map((g) => [g.id, g.startSlot]));
  for (const { gearAId, gearBId } of swaps) {
    const a = slots.get(gearAId)!;
    slots.set(gearAId, slots.get(gearBId)!);
    slots.set(gearBId, a);
  }
  return {
    ...diagram,
    gears: diagram.gears.map((g) => ({ ...g, startSlot: slots.get(g.id)! })),
  };
}

type Preset = (typeof presets)[Difficulty];

function shapeOf(preset: Preset) {
  return {
    slotCount: preset.slotCount,
    halfWidthDeg: preset.halfWidthDeg,
    cranks: preset.teeth.reduce(lcm, 1),
  };
}

type Shape = ReturnType<typeof shapeOf>;

const draftMask = (shape: Shape, draft: Draft) =>
  seesMask(
    shape,
    draft.teeth,
    signAt(draft.startSlot),
    phaseOf(
      shape.slotCount,
      draft.teeth,
      draft.startSlot,
      draft.initialOffset,
    ),
  );

const hasBit = (mask: Mask, bit: number) =>
  (mask[bit >> 5]! & (1 << (bit & 31))) !== 0;

function bitsOf(mask: Mask) {
  const bits: number[] = [];
  for (let b = 0; b < mask.length * 32; b++) if (hasBit(mask, b)) bits.push(b);
  return bits;
}

/** Cells of `base` that neither `cover` nor `extra` sees. */
function uncovered(base: Mask, cover: Mask, extra: Mask) {
  const left = new Uint32Array(base.length);
  for (let w = 0; w < base.length; w++) {
    left[w] = base[w]! & ~cover[w]! & ~extra[w]!;
  }
  return left;
}

type Group = { drafts: Draft[]; mask: Mask };

function sampleGroup(
  rand: Rand,
  preset: Preset,
  shape: Shape,
  size: number,
  taken: ReadonlySet<number>,
): Group | null {
  const { slotCount } = preset;
  for (let tries = 0; tries < 20; tries++) {
    const teeth = pick(rand, preset.teeth);
    const step = lcm(2, slotCount / gcd(slotCount, teeth));
    const first = below(rand, step);
    const slots: number[] = [];
    for (let s = first; s < slotCount; s += step) {
      if (!taken.has(s)) slots.push(s);
    }
    if (slots.length < size) continue;
    const chosen = shuffle(rand, slots).slice(0, size);
    const phase = phaseOf(
      slotCount,
      teeth,
      chosen[0]!,
      below(rand, teeth),
    );
    const drafts = chosen.map((startSlot) => ({
      teeth,
      startSlot,
      initialOffset: ((phase + teeth * startSlot) / slotCount) % teeth,
    }));
    return { drafts, mask: draftMask(shape, drafts[0]!) };
  }
  return null;
}

function groupSizes(others: number) {
  const sizes = others % 2 === 1 ? [3] : [];
  for (let left = others - (others % 2 === 1 ? 3 : 0); left > 0; left -= 2) {
    sizes.push(2);
  }
  return sizes;
}

/** Steps 1 to 3: a draft of `count` gears whose only win is the planted one, or null. */
function plantAndCover(
  rand: Rand,
  preset: Preset,
  shape: Shape,
  count: number,
): Draft[] | null {
  const killerTeeth = pick(rand, preset.teeth);
  const killer: Draft = {
    teeth: killerTeeth,
    startSlot: below(rand, preset.slotCount),
    initialOffset: below(rand, killerTeeth),
  };
  const killerMask = draftMask(shape, killer);
  const killerBits = bitsOf(killerMask);
  const planted = pick(rand, killerBits);
  const target = new Uint32Array(killerMask);
  target[planted >> 5]! &= ~(1 << (planted & 31));

  const sizes = groupSizes(count - 1);
  const groups: Group[] = [];
  const nothing = new Uint32Array(target.length);

  const unionExcept = (skip: number) => {
    const union = new Uint32Array(target.length);
    groups.forEach((group, i) => {
      if (i === skip) return;
      for (let w = 0; w < union.length; w++) union[w]! |= group.mask[w]!;
    });
    return union;
  };
  const takenExcept = (skip: number) => {
    const taken = new Set<number>([killer.startSlot]);
    groups.forEach((group, i) => {
      if (i !== skip) group.drafts.forEach((d) => taken.add(d.startSlot));
    });
    return taken;
  };
  const bestGroup = (skip: number, size: number) => {
    const union = unionExcept(skip);
    const taken = takenExcept(skip);
    let best: Group | null = null;
    let bestLeft = Infinity;
    for (let k = 0; k < CANDIDATES_PER_GROUP; k++) {
      const group = sampleGroup(rand, preset, shape, size, taken);
      if (!group || hasBit(group.mask, planted)) continue;
      const left = countBits(uncovered(target, union, group.mask));
      if (left < bestLeft) {
        best = group;
        bestLeft = left;
      }
    }
    return best;
  };
  const residual = () => {
    const union = unionExcept(-1);
    return countBits(uncovered(target, union, nothing));
  };

  for (const size of sizes) {
    const group = bestGroup(-1, size);
    if (!group) return null;
    groups.push(group);
  }
  let left = residual();
  for (let round = 0; round < POLISH_ROUNDS && left > 0; round++) {
    const i = below(rand, groups.length);
    const replacement = bestGroup(i, groups[i]!.drafts.length);
    if (!replacement) continue;
    const previous = groups[i]!;
    groups[i] = replacement;
    const now = residual();
    if (now <= left) left = now;
    else groups[i] = previous;
  }
  if (left > 0) return null;

  const drafts = [killer, ...groups.flatMap((group) => group.drafts)];
  const parities = new Set(drafts.map((d) => d.startSlot % 2));
  if (parities.size < 2) return null;
  const lone = loneBits(
    drafts.map((d) => draftMask(shape, d)),
    killerMask.length,
  );
  return countBits(lone) === 1 ? drafts : null;
}

const crosses = (p: [number, number], q: [number, number]) => {
  const [a, b] = p[0] < p[1] ? p : [p[1], p[0]];
  const [c, d] = q[0] < q[1] ? q : [q[1], q[0]];
  return (a < c && c < b && b < d) || (c < a && a < d && d < b);
};

/** Ring edges plus the fewest, shortest, non-crossing chords that connect all gears. */
function meshPairs(slots: number[], slotCount: number, rand: Rand) {
  const n = slots.length;
  const parent = slots.map((_, i) => i);
  const root = (i: number): number =>
    parent[i] === i ? i : (parent[i] = root(parent[i]!));
  const pairs: [number, number][] = [];
  const join = (i: number, j: number) => {
    pairs.push([i, j]);
    parent[root(i)] = root(j);
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = slots[j]! - slots[i]!;
      if (d === 1 || d === slotCount - 1) join(i, j);
    }
  }
  const chords: [number, number][] = [];
  const candidates: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if ((slots[j]! - slots[i]!) % 2 !== 0) candidates.push([i, j]);
    }
  }
  const length = ([i, j]: [number, number]) => {
    const d = slots[j]! - slots[i]!;
    return Math.min(d, slotCount - d);
  };
  shuffle(rand, candidates).sort((p, q) => length(p) - length(q));
  for (const candidate of candidates) {
    if (root(candidate[0]) === root(candidate[1])) continue;
    const slotsOf = ([i, j]: [number, number]): [number, number] => [
      slots[i]!,
      slots[j]!,
    ];
    if (chords.some((chord) => crosses(slotsOf(chord), slotsOf(candidate)))) {
      continue;
    }
    chords.push(candidate);
    join(candidate[0], candidate[1]);
  }
  return new Set(slots.map((_, i) => root(i))).size === 1 ? pairs : null;
}

function labelled(
  rand: Rand,
  preset: Preset,
  drafts: Draft[],
  seed: string,
): Content | null {
  const sorted = [...drafts].sort((a, b) => a.startSlot - b.startSlot);
  const pairs = meshPairs(
    sorted.map((d) => d.startSlot),
    preset.slotCount,
    rand,
  );
  if (!pairs) return null;
  const label = (i: number) => String.fromCharCode(65 + i);
  const evens = sorted.flatMap((d, i) => (d.startSlot % 2 === 0 ? [i] : []));
  const driver = pick(rand, evens);
  const mIn = between(rand, preset.mIn);
  let mOut = between(rand, preset.mOut);
  while (mOut === mIn) mOut = between(rand, preset.mOut);
  return {
    slotCount: preset.slotCount,
    mIn,
    mOut,
    maxAdjustments: 0,
    occlusion: false,
    generatorSeed: seed,
    gears: sorted.map((d, i) => ({
      label: label(i),
      teeth: d.teeth,
      startSlot: d.startSlot,
      initialOffset: d.initialOffset,
      halfWidthDeg: preset.halfWidthDeg,
      isDriver: i === driver,
    })),
    meshes: pairs
      .map(([i, j]) => ({ a: label(i), b: label(j) }))
      .sort((p, q) => (p.a + p.b).localeCompare(q.a + q.b)),
    solution: { crank: 0, convergence: 1, killerLabel: "A", swaps: [] },
  };
}

function drawUnique(rand: Rand, preset: Preset, seed: string) {
  const shape = shapeOf(preset);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const count = between(rand, preset.gears);
    const drafts = plantAndCover(rand, preset, shape, count);
    if (!drafts) continue;
    const content = labelled(rand, preset, drafts, seed);
    if (!content) continue;
    const wins = solveAll(diagramOf(content));
    if (wins.length !== 1) continue;
    const [win] = wins;
    return {
      ...content,
      solution: {
        crank: win!.crank,
        convergence: win!.convergence,
        killerLabel: win!.killerId,
        swaps: [],
      },
    };
  }
  throw new Error(`No unique diagram found for seed ${seed}`);
}

export function generateDiagram(seed: string, difficulty: Difficulty): Content {
  const rand = mulberry32(hashSeed(`${seed}:${difficulty}`));
  return drawUnique(rand, presets[difficulty], seed);
}

type SwapIndexes = [number, number][];

/** Every set of at most `max` disjoint pairs drawn from `n` gears. */
function swapIndexSets(n: number, max: number) {
  const sets: SwapIndexes[] = [];
  const extend = (set: SwapIndexes, from: number, used: ReadonlySet<number>) => {
    for (let a = from; a < n; a++) {
      if (used.has(a)) continue;
      for (let b = a + 1; b < n; b++) {
        if (used.has(b)) continue;
        const next: SwapIndexes = [...set, [a, b]];
        sets.push(next);
        if (next.length < max) extend(next, a + 1, new Set([...used, a, b]));
      }
    }
  };
  extend([], 0, new Set());
  return sets;
}

/** Counts, for any slot permutation of a diagram, the moments where exactly one gear sees. */
function swapScanner(diagram: Diagram) {
  const signs = spinSigns(
    diagram.gears,
    diagram.meshes,
    diagram.gears.find((g) => g.isDriver)!.id,
  );
  if (!signs.ok) throw new Error(signs.error);
  const cranks = lcmTeeth(diagram.gears);
  const words = maskWords(cranks);
  const slots = diagram.gears.map((g) => g.startSlot);
  const masks = diagram.gears.map((gear) =>
    slots.map((slot) =>
      seesMask(
        {
          slotCount: diagram.slotCount,
          halfWidthDeg: gear.halfWidthDeg,
          cranks,
        },
        gear.teeth,
        signs.signs[gear.id]!,
        phaseOf(diagram.slotCount, gear.teeth, slot, gear.initialOffset),
      ),
    ),
  );
  return {
    count: diagram.gears.length,
    wins(swaps: SwapIndexes) {
      const at = diagram.gears.map((_, i) => i);
      for (const [a, b] of swaps) [at[a], at[b]] = [at[b]!, at[a]!];
      return countBits(loneBits(at.map((slot, g) => masks[g]![slot]!), words));
    },
  };
}

function swapsOf(diagram: Diagram, set: SwapIndexes): Swaps {
  return set.map(([a, b]) =>
    orderedPair(diagram.gears[a]!.id, diagram.gears[b]!.id),
  );
}

/**
 * Every set of at most K disjoint slot swaps that turns the diagram into one with exactly one
 * solution. Swaps are returned as gear id pairs with `gearAId < gearBId`.
 */
export function repairsOf(diagram: Diagram, K: number): Swaps[] {
  const scan = swapScanner(diagram);
  return swapIndexSets(scan.count, K)
    .filter((set) => scan.wins(set) === 1)
    .map((set) => swapsOf(diagram, set));
}

const sameSwaps = (a: Swaps, b: Swaps) =>
  JSON.stringify(a) === JSON.stringify(b);

export function generateFixVariant(
  seed: string,
  difficulty: Difficulty,
  K: number,
): Content {
  const preset = presets[difficulty];
  const rand = mulberry32(hashSeed(`${seed}:${difficulty}:fix${K}`));
  for (let drawn = 0; drawn < MAX_VARIANT_DIAGRAMS; drawn++) {
    const solved = drawUnique(rand, preset, seed);
    const solvedDiagram = diagramOf(solved);
    const scan = swapScanner(solvedDiagram);
    const candidates = shuffle(
      rand,
      swapIndexSets(scan.count, K).filter((set) => set.length === K),
    );
    for (const set of candidates) {
      if (scan.wins(set) !== 0) continue;
      const swaps = swapsOf(solvedDiagram, set);
      const printed = applySwaps(solvedDiagram, swaps);
      const repairs = repairsOf(printed, K);
      if (repairs.length !== 1 || !sameSwaps(repairs[0]!, swaps)) continue;
      if (solveAll(printed).length !== 0) continue;
      return {
        ...solved,
        maxAdjustments: K,
        gears: solved.gears.map((gear) => ({
          ...gear,
          startSlot: printed.gears.find((g) => g.id === gear.label)!.startSlot,
        })),
        solution: {
          ...solved.solution,
          swaps: swaps.map(({ gearAId, gearBId }) => ({
            a: gearAId,
            b: gearBId,
          })),
        },
      };
    }
  }
  throw new Error(`No Fix the Diagram variant found for seed ${seed}`);
}
