import type { Answer, ClueParams, Payload } from "./schema";

type Worker = Payload["workers"][number];
export type Square = Pick<Worker["squares"][number], "file" | "rank">;
export type Phase = Worker["squares"][number]["phase"];
/** Worker id to the square the worker stands on. */
export type Placement = Readonly<Record<string, Square>>;
/** `workerAId` is the instigator when the swap opens a sequence. */
export type Swap = Answer["swaps"][number];

type Step = { swap: Swap; squareA: Square; squareB: Square };
type Trace = { placements: Placement[]; steps: Step[] };

const FILES = "abcdefgh";

const sameSquare = (a: Square, b: Square) =>
  a.file === b.file && a.rank === b.rank;

const fileIndex = (square: Square) => FILES.indexOf(square.file);

const squareOf = (placement: Placement, workerId: string) => {
  const square = placement[workerId];
  if (!square) throw new Error(`Unknown worker: ${workerId}`);
  return square;
};

export function placementFor(workers: Worker[], phase: Phase): Placement {
  return Object.fromEntries(
    workers.map(({ id, squares }) => {
      const square = squares.find((s) => s.phase === phase);
      if (!square) throw new Error(`Worker ${id} has no ${phase} square`);
      return [id, { file: square.file, rank: square.rank }];
    }),
  );
}

export function samePlacement(a: Placement, b: Placement) {
  const ids = Object.keys(a);
  return (
    ids.length === Object.keys(b).length &&
    ids.every((id) => b[id] && sameSquare(a[id], b[id]))
  );
}

function swapOnce(placement: Placement, swap: Swap): Placement {
  return {
    ...placement,
    [swap.workerAId]: squareOf(placement, swap.workerBId),
    [swap.workerBId]: squareOf(placement, swap.workerAId),
  };
}

/** Applies the swaps in order, each exchanging the squares of two workers. */
export function applySwaps(placement: Placement, swaps: Swap[]): Placement {
  return swaps.reduce(swapOnce, placement);
}

function trace(intended: Placement, swaps: Swap[]): Trace {
  const placements = [intended];
  const steps: Step[] = [];
  for (const swap of swaps) {
    const before = placements[placements.length - 1];
    steps.push({
      swap,
      squareA: squareOf(before, swap.workerAId),
      squareB: squareOf(before, swap.workerBId),
    });
    placements.push(swapOnce(before, swap));
  }
  return { placements, steps };
}

type Evaluator<K extends ClueParams["kind"]> = (
  clue: Extract<ClueParams, { kind: K }>,
  run: Trace,
) => boolean;

const evaluators: { [K in ClueParams["kind"]]: Evaluator<K> } = {
  unpowered_square: (clue, { steps }) =>
    steps.every(
      ({ squareA, squareB }) =>
        !sameSquare(squareA, clue) && !sameSquare(squareB, clue),
    ),
  adjacent_only: (_clue, { steps }) =>
    steps.every(
      ({ squareA, squareB }) =>
        Math.abs(fileIndex(squareA) - fileIndex(squareB)) +
          Math.abs(squareA.rank - squareB.rank) ===
        1,
    ),
  never_in_rank: (clue, { placements }) =>
    placements.every(
      (placement) => squareOf(placement, clue.workerId).rank !== clue.rank,
    ),
  max_swaps: (clue, { steps }) => steps.length <= clue.maxSwaps,
};

function evaluate(clue: ClueParams, run: Trace) {
  const evaluator = evaluators[clue.kind] as Evaluator<typeof clue.kind>;
  return evaluator(clue, run);
}

/** True when the swap sequence, applied forwards from the intended placement, satisfies every clue. */
export function validateClues(
  intended: Placement,
  swaps: Swap[],
  clues: ClueParams[],
) {
  const run = trace(intended, swaps);
  return clues.every((clue) => evaluate(clue, run));
}

/**
 * Breadth-first search for swap sequences from `intended` to `final` that satisfy every clue.
 * Every clue is checkable on a prefix, so invalid prefixes are pruned. Stops once `cap` sequences are found.
 */
export function solve(
  intended: Placement,
  final: Placement,
  clues: ClueParams[],
  { maxSteps = Object.keys(intended).length, cap = 2 } = {},
) {
  const workerIds = Object.keys(intended).sort();
  const found: Swap[][] = [];
  let frontier: { placement: Placement; swaps: Swap[] }[] = [
    { placement: intended, swaps: [] },
  ];
  for (let depth = 0; depth <= maxSteps && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { placement, swaps } of frontier) {
      if (samePlacement(placement, final)) {
        found.push(swaps);
        if (found.length >= cap) return found;
      }
      if (depth === maxSteps) continue;
      for (let i = 0; i < workerIds.length; i++) {
        for (let j = i + 1; j < workerIds.length; j++) {
          const swap = { workerAId: workerIds[i], workerBId: workerIds[j] };
          const extended = [...swaps, swap];
          if (!validateClues(intended, extended, clues)) continue;
          next.push({ placement: swapOnce(placement, swap), swaps: extended });
        }
      }
    }
    frontier = next;
  }
  return found;
}

/** The first swap of a sequence and the worker who instigated it, by convention `workerAId`. */
export function openingGambit(sequence: Swap[]) {
  const [swap] = sequence;
  if (!swap) return undefined;
  return { swap, instigator: swap.workerAId };
}
