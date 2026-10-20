import {
  bit,
  type CandidateState,
  combinations,
  eliminate,
  place,
  type Technique,
} from "../_shared/generate/candidates";
import { boxUnits, colUnits, rowUnits, type Variant } from "./engine";

const SIZE = 9;
const ALL_DIGITS = 0b1111111110;
const UNIT_SUM = (SIZE * (SIZE + 1)) / 2;
const MAX_LEFTOVER_UNITS = 3;
const MAX_LEFTOVER_CELLS = 3;

type Pair = NonNullable<Variant["xv"]>[number];
type Relation = { cells: ReadonlyArray<number>; total: number };

const maskOf = (state: CandidateState, index: number) =>
  state.grid[index] ? bit(state.grid[index]) : state.cand[index];

/**
 * The digits each cell can take in some assignment of its candidates that adds up to `total`,
 * with no digit repeated between cells for which `distinct` holds.
 */
function supported(
  masks: ReadonlyArray<number>,
  total: number,
  distinct: (a: number, b: number) => boolean,
) {
  const out = masks.map(() => 0);
  const picked: number[] = [];
  const walk = (cell: number, rest: number) => {
    if (cell === masks.length) {
      if (rest === 0) picked.forEach((digit, k) => (out[k] |= bit(digit)));
      return;
    }
    const after = masks.length - cell - 1;
    for (let digit = 1; digit <= SIZE; digit++) {
      if (!(masks[cell] & bit(digit))) continue;
      const left = rest - digit;
      if (left < after || left > after * SIZE) continue;
      if (picked.some((other, k) => other === digit && distinct(k, cell))) {
        continue;
      }
      picked.push(digit);
      walk(cell + 1, left);
      picked.pop();
    }
  };
  walk(0, total);
  return out;
}

const unplacedOf = (state: CandidateState, cells: ReadonlyArray<number>) =>
  cells.filter((index) => !state.grid[index]);

const placedSum = (state: CandidateState, cells: ReadonlyArray<number>) =>
  cells.reduce((sum, index) => sum + state.grid[index], 0);

/** A cage with one empty cell left: that cell is the sum less the rest. */
const cageSingle = (cages: Variant["cages"]): Technique => ({
  name: "cage single",
  level: 1,
  apply(state) {
    let progress = false;
    for (const { cells, sum } of cages) {
      const [open, ...more] = unplacedOf(state, cells);
      if (open === undefined || more.length) continue;
      const digit = sum - placedSum(state, cells);
      if (digit >= 1 && digit <= SIZE && state.cand[open] & bit(digit)) {
        place(state, open, digit);
      } else {
        eliminate(state, open, state.cand[open]);
      }
      progress = true;
    }
    return progress;
  },
});

/** The combinations of distinct digits that make a cage's sum, narrowed by what its cells can still be. */
const cageCombinations = (cages: Variant["cages"]): Technique => ({
  name: "cage combinations",
  level: 2,
  apply(state) {
    let progress = false;
    for (const { cells, sum } of cages) {
      const open = unplacedOf(state, cells);
      if (!open.length) continue;
      const taken = cells.reduce(
        (mask, index) =>
          state.grid[index] ? mask | bit(state.grid[index]) : mask,
        0,
      );
      const keep = supported(
        open.map((index) => state.cand[index] & ~taken),
        sum - placedSum(state, cells),
        () => true,
      );
      open.forEach((index, k) => {
        if (eliminate(state, index, state.cand[index] & ~keep[k])) {
          progress = true;
        }
      });
    }
    return progress;
  },
});

/**
 * The leftover cells of rows, columns or boxes against the cages. n units hold 45n between them,
 * so the cages inside them leave their innies with the difference, and the cages over them stick
 * out by their outies, which make the difference the other way.
 */
function sumRelations(cages: Variant["cages"]) {
  const cageOf = new Map<number, number>();
  cages.forEach(({ cells }, id) =>
    cells.forEach((cell) => cageOf.set(cell, id)),
  );
  const relations = new Map<string, Relation>();
  const add = (cells: ReadonlyArray<number>, total: number) => {
    if (cells.length < 1 || cells.length > MAX_LEFTOVER_CELLS) return;
    const sorted = [...cells].sort((a, b) => a - b);
    relations.set(`${sorted}:${total}`, { cells: sorted, total });
  };
  for (const kind of [rowUnits, colUnits, boxUnits]) {
    for (let size = 1; size <= MAX_LEFTOVER_UNITS; size++) {
      combinations(kind, size, (picked) => {
        const inside = new Set(picked.flat());
        const touching = new Set<number>();
        for (const cell of inside) {
          const id = cageOf.get(cell);
          if (id !== undefined) touching.add(id);
        }
        const within = [...touching].filter((id) =>
          cages[id].cells.every((cell) => inside.has(cell)),
        );
        const covered = new Set(within.flatMap((id) => cages[id].cells));
        add(
          [...inside].filter((cell) => !covered.has(cell)),
          size * UNIT_SUM -
            within.reduce((sum, id) => sum + cages[id].sum, 0),
        );
        if ([...inside].every((cell) => cageOf.has(cell))) {
          add(
            [...touching]
              .flatMap((id) => cages[id].cells)
              .filter((cell) => !inside.has(cell)),
            [...touching].reduce((sum, id) => sum + cages[id].sum, 0) -
              size * UNIT_SUM,
          );
        }
        return false;
      });
    }
  }
  return [...relations.values()];
}

/** Applies the leftover relations that have `open` empty cells: those cells must make what the sum has left. */
const cageSumArithmetic = (
  relations: ReadonlyArray<Relation>,
  open: 1 | 2 | 3,
): Technique => ({
  name: `cage sum arithmetic (${open} cell${open > 1 ? "s" : ""})`,
  level: (open + 2) as 3 | 4 | 5,
  apply(state) {
    for (const { cells, total } of relations) {
      const empty = unplacedOf(state, cells);
      if (empty.length !== open) continue;
      const keep = supported(
        empty.map((index) => state.cand[index]),
        total - placedSum(state, cells),
        (a, b) => state.peers[empty[a]].includes(empty[b]),
      );
      let progress = false;
      empty.forEach((index, k) => {
        if (eliminate(state, index, state.cand[index] & ~keep[k])) {
          progress = true;
        }
      });
      if (progress) return true;
    }
    return false;
  },
});

const pairAllows = (sum: Pair["sum"], first: number, second: number) =>
  sum === null
    ? first + second !== 5 && first + second !== 10
    : first + second === sum;

/** Digits the other cell of a pair may take once one cell holds `digit`. */
function partnerMask(sum: Pair["sum"], digit: number) {
  if (sum !== null) {
    const want = sum - digit;
    return want >= 1 && want <= SIZE ? bit(want) : 0;
  }
  let mask = ALL_DIGITS;
  for (const forbidden of [5 - digit, 10 - digit]) {
    if (forbidden >= 1 && forbidden <= SIZE) mask &= ~bit(forbidden);
  }
  return mask;
}

function pairsByCell(pairs: ReadonlyArray<Pair>) {
  const pairsOf: Pair[][] = Array.from({ length: SIZE * SIZE }, () => []);
  for (const pair of pairs) {
    pairsOf[pair.a].push(pair);
    pairsOf[pair.b].push(pair);
  }
  return pairsOf;
}

/** A placed digit narrows its XV partners at once, the way it clears its row. */
export function afterPlaceFor(
  variant: Variant,
): CandidateState["afterPlace"] | undefined {
  if (!variant.xv) return undefined;
  const pairsOf = pairsByCell(variant.xv);
  return (state, index, digit) => {
    for (const { a, b, sum } of pairsOf[index]) {
      const other = a === index ? b : a;
      eliminate(state, other, ALL_DIGITS & ~partnerMask(sum, digit));
    }
  };
}

/** Each digit of an XV pair needs a partner among the other cell's candidates, marked or by the negative rule. */
const xvPairs = (pairs: ReadonlyArray<Pair>): Technique => ({
  name: "xv pair",
  level: 2,
  apply(state) {
    let progress = false;
    for (const { a, b, sum } of pairs) {
      const first = maskOf(state, a);
      const second = maskOf(state, b);
      let firstKeep = 0;
      let secondKeep = 0;
      for (let x = 1; x <= SIZE; x++) {
        for (let y = 1; y <= SIZE; y++) {
          if (first & bit(x) && second & bit(y) && pairAllows(sum, x, y)) {
            firstKeep |= bit(x);
            secondKeep |= bit(y);
          }
        }
      }
      if (eliminate(state, a, state.cand[a] & ~firstKeep)) progress = true;
      if (eliminate(state, b, state.cand[b] & ~secondKeep)) progress = true;
    }
    return progress;
  },
});

/** The techniques a puzzle's killer cages and XV marks add to the ladder. */
export function variantTechniques({
  cages,
  xv,
}: Variant): ReadonlyArray<Technique> {
  const relations = cages.length ? sumRelations(cages) : [];
  return [
    ...(cages.length
      ? [
          cageSingle(cages),
          cageCombinations(cages),
          cageSumArithmetic(relations, 1),
          cageSumArithmetic(relations, 2),
          cageSumArithmetic(relations, 3),
        ]
      : []),
    ...(xv ? [xvPairs(xv)] : []),
  ];
}
