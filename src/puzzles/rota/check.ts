import {
  applySwaps,
  placementFor,
  samePlacement,
  validateClues,
} from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** The clues the swaps break, applied forwards from the intended rota, in clue order. */
export function brokenClues(payload: Payload, swaps: Answer["swaps"]) {
  const intended = placementFor(payload.workers, "intended");
  return payload.clues.filter(
    (clue) => !validateClues(intended, swaps, [clue]),
  );
}

/**
 * `violatedClue` depends only on the payload and the answer, so the result never hints at the solution.
 * The authored instigator is revealed in `epilogue` only for a correct answer.
 */
export function check(
  payload: Payload,
  solution: Solution,
  answer: Answer,
): { correct: boolean; violatedClue?: number; epilogue?: string } {
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
    answer.swaps.length === solution.swaps.length &&
    samePlacement(applySwaps(intended, answer.swaps), final) &&
    !broken;
  const instigator = payload.workers.find(
    ({ id }) => id === solution.instigatorWorkerId,
  );
  return {
    correct,
    violatedClue: broken?.position,
    ...(correct && instigator
      ? { epilogue: `Opening gambit: ${instigator.name} insisted on it.` }
      : {}),
  };
}
