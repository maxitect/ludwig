import {
  isStartingPlacement,
  reproducesFromStart,
  satisfiesGoal,
  toFen,
} from "./derive";
import { applyRetro, retroKey, toRetro, unwindChain } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** Mode A: the single answered ply must be a legal retro move that equals the authored ply. */
function checkLastMove(payload: Payload, solution: Solution, answer: Answer) {
  if (answer.plies.length !== 1 || solution.plies.length !== 1) return false;
  const retro = toRetro(answer.plies[0]);
  const result = applyRetro(toFen(payload), retro);
  return result.ok && retroKey(retro) === retroKey(toRetro(solution.plies[0]));
}

/**
 * Mode B: every answered ply must be a legal retro move on the previous prior position, and the last prior must meet the goal.
 * The `initial_position` goal needs the standard start, and the chain read forward from it must reproduce the puzzle, castling rights and en passant square included.
 */
function checkUnwind(payload: Payload, solution: Solution, answer: Answer) {
  if (!solution.goal || answer.plies.length !== payload.plyCount) return false;
  const shown = toFen(payload);
  const unwound = unwindChain(shown, answer.plies.map(toRetro));
  if (!unwound.ok) return false;
  if (solution.goal.kind === "initial_position") {
    return (
      isStartingPlacement(unwound.last) &&
      reproducesFromStart(unwound.forward, shown)
    );
  }
  return satisfiesGoal(unwound.last, solution.goal);
}

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const correct =
    payload.mode === "last_move"
      ? checkLastMove(payload, solution, answer)
      : checkUnwind(payload, solution, answer);
  return { correct };
}
