import {
  applySwaps,
  placementFor,
  samePlacement,
  validateClues,
} from "./engine";
import type { Answer, Payload, Solution } from "./schema";
import { type Square } from "./engine";
import { zoneName } from "./stack";

/** The clues the swaps break, applied forwards from the intended rota, in clue order. */
export function brokenClues(payload: Payload, swaps: Answer["swaps"]) {
  const intended = placementFor(payload.workers, "intended");
  return payload.clues.filter(
    (clue) => !validateClues(intended, swaps, [clue]),
  );
}

const zoneCount = (distance: number) =>
  distance === 1 ? "one zone" : `${distance} zones`;

const distance = (a: Square, b: Square) =>
  Math.abs(a.file.charCodeAt(0) - b.file.charCodeAt(0)) +
  Math.abs(a.rank - b.rank);

/** The forward timeline, one line per authored swap, then the confession. Built only for a correct answer. */
function timeline(payload: Payload, solution: Solution) {
  const nameOf = (id: string) =>
    payload.workers.find((worker) => worker.id === id)?.name ?? id;
  const victim = payload.victimWorkerId;
  const hazard = placementFor(payload.workers, "final")[victim];
  let placement = placementFor(payload.workers, "intended");
  const lines = solution.swaps.map((swap, index) => {
    const before = placement[victim];
    placement = applySwaps(placement, [swap]);
    const after = placement[victim];
    const left = distance(after, hazard);
    const achieved =
      left === 0
        ? `${nameOf(victim)} is now on ${zoneName(hazard)}.`
        : `${nameOf(victim)} is ${distance(before, after) ? "now" : "still"} ${zoneCount(left)} from ${zoneName(hazard)}.`;
    return `Step ${index + 1}: ${nameOf(swap.workerAId)} and ${nameOf(swap.workerBId)} swap. ${swap.excuse} ${achieved}`;
  });
  const instigator = nameOf(solution.instigatorWorkerId);
  return [
    ...lines,
    `${instigator} insisted on the first swap. From there, every favour fell the way ${instigator} needed it.`,
  ];
}

/**
 * `violatedClue` depends only on the payload and the answer, so the result never hints at the solution.
 * The accusation is judged after the sequence, and the epilogue is built only for a correct answer.
 */
export function check(
  payload: Payload,
  solution: Solution,
  answer: Answer,
): { correct: boolean; violatedClue?: number; epilogue?: string[] } {
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
    !broken &&
    answer.instigatorWorkerId === solution.instigatorWorkerId;
  return {
    correct,
    violatedClue: broken?.position,
    ...(correct ? { epilogue: timeline(payload, solution) } : {}),
  };
}
