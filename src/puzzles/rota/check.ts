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
  if (
    !openingGambit(answer) ||
    answer.instigatorWorkerId !== solution.instigatorWorkerId ||
    answer.swaps.length !== solution.swaps.length ||
    !answer.swaps.every(
      ({ workerAId, workerBId }) =>
        workerAId !== workerBId && known.has(workerAId) && known.has(workerBId),
    )
  ) {
    return { correct: false };
  }
  const intended = placementFor(payload.workers, "intended");
  const final = placementFor(payload.workers, "final");
  const correct =
    samePlacement(applySwaps(intended, answer.swaps), final) &&
    validateClues(intended, answer.swaps, payload.clues);
  return { correct };
}
