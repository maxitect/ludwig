import {
  applySwaps,
  openingGambit,
  placementFor,
  samePlacement,
  validateClues,
} from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** The first clue the swaps break, applied forwards from the intended rota, or undefined when none is broken. */
export function violatedClue(payload: Payload, swaps: Answer["swaps"]) {
  const intended = placementFor(payload.workers, "intended");
  return payload.clues.find((clue) => !validateClues(intended, swaps, [clue]));
}

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
  const broken = violatedClue(payload, answer.swaps);
  const correct =
    samePlacement(applySwaps(intended, answer.swaps), final) && !broken;
  return { correct, violatedClue: broken?.position };
}
