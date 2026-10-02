import {
  applySwaps,
  openingGambit,
  placementFor,
  samePlacement,
  validateClues,
} from "./engine";
import type { Answer, Payload, Solution } from "./schema";

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const known = new Set(payload.workers.map((worker) => worker.id));
  const gambit = openingGambit(answer.swaps);
  if (
    !gambit ||
    !answer.swaps.every(
      ({ workerAId, workerBId }) => known.has(workerAId) && known.has(workerBId),
    )
  ) {
    return { correct: false };
  }
  const intended = placementFor(payload.workers, "intended");
  const final = placementFor(payload.workers, "final");
  const correct =
    answer.instigatorWorkerId === solution.instigatorWorkerId &&
    (gambit.swap.workerAId === answer.instigatorWorkerId ||
      gambit.swap.workerBId === answer.instigatorWorkerId) &&
    samePlacement(applySwaps(intended, answer.swaps), final) &&
    validateClues(intended, answer.swaps, payload.clues);
  return { correct };
}
