import type { Answer, ClueParams, Payload } from "./schema";

type Worker = Payload["workers"][number];
export type Square = Pick<Worker["squares"][number], "file" | "rank">;
export type Phase = Worker["squares"][number]["phase"];
/** Worker id to the square the worker stands on. */
export type Placement = Readonly<Record<string, Square>>;
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
 * Breadth-first search for the shortest swap sequences from `intended` to `final` that satisfy every clue,
 * returning at most `cap` of them. Every clue depends only on the current placement and the step count, so
 * sequences meeting in one placement are merged and a placement already reached at a shallower depth is dropped.
 */
export function solve(
  intended: Placement,
  final: Placement,
  clues: ClueParams[],
  { cap = 2 } = {},
) {
  if (!validateClues(intended, [], clues)) return [];
  const workerIds = Object.keys(intended).sort();
  const keyOf = (placement: Placement) =>
    workerIds
      .map((id) => {
        const { file, rank } = squareOf(placement, id);
        return `${file}${rank}`;
      })
      .join();
  const target = keyOf(final);
  const seen = new Set([keyOf(intended)]);
  let frontier = new Map([
    [keyOf(intended), { placement: intended, sequences: [[]] as Swap[][] }],
  ]);
  while (frontier.size) {
    const reached = frontier.get(target);
    if (reached) return reached.sequences;
    const next: typeof frontier = new Map();
    for (const { placement, sequences } of frontier.values()) {
      for (let i = 0; i < workerIds.length; i++) {
        for (let j = i + 1; j < workerIds.length; j++) {
          const swap = { workerAId: workerIds[i], workerBId: workerIds[j] };
          if (!validateClues(intended, [...sequences[0], swap], clues)) {
            continue;
          }
          const moved = swapOnce(placement, swap);
          const key = keyOf(moved);
          if (seen.has(key)) continue;
          const entry = next.get(key) ?? { placement: moved, sequences: [] };
          const room = cap - entry.sequences.length;
          for (const sequence of sequences.slice(0, room)) {
            entry.sequences.push([...sequence, swap]);
          }
          next.set(key, entry);
        }
      }
    }
    for (const key of next.keys()) seen.add(key);
    frontier = next;
  }
  return [];
}

/** The first swap of a sequence with its authored instigator, or undefined when the instigator is not in that swap. */
export function openingGambit({
  swaps: [swap],
  instigatorWorkerId,
}: Pick<Answer, "swaps" | "instigatorWorkerId">) {
  if (
    !swap ||
    (swap.workerAId !== instigatorWorkerId &&
      swap.workerBId !== instigatorWorkerId)
  ) {
    return undefined;
  }
  return { swap, instigator: instigatorWorkerId };
}
