import {
  applySwaps,
  openingGambit,
  placementFor,
  samePlacement,
  validateClues,
} from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** The clues the swaps break, applied forwards from the intended rota, in clue order. */
export function brokenClues(payload: Payload, swaps: Answer["swaps"]) {
  const intended = placementFor(payload.workers, "intended");
  return payload.clues.filter((clue) => !validateClues(intended, swaps, [clue]));
}

/** `violatedClue` depends only on the payload and the answer, so the result never hints at the solution. */
export function check(payload: Payload, solution: Solution, answer: Answer) {
  const known = new Set(payload.workers.map((worker) => worker.id));
  if (
    !answer.swaps.every(
      ({ workerAId, workerBId }) =>
        workerAId !== workerBId && known.has(workerAId) && known.has(workerBId),
    )
  ) {
    return { correct: false };
  }
  const intended = placementFor(payload.workers, "intended");
  const final = placementFor(payload.workers, "final");
  const [broken] = brokenClues(payload, answer.swaps);
  const correct =
    Boolean(openingGambit(answer)) &&
    answer.instigatorWorkerId === solution.instigatorWorkerId &&
    answer.swaps.length === solution.swaps.length &&
    samePlacement(applySwaps(intended, answer.swaps), final) &&
    !broken;
  return { correct, violatedClue: broken?.position };
}
