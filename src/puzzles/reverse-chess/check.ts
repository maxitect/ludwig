import { satisfiesGoal, toFen } from "./derive";
import { applyRetro, retroKey, stepRetro, toRetro } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** Mode A: the single answered ply must be a legal retro move that equals the authored ply. */
function checkLastMove(payload: Payload, solution: Solution, answer: Answer) {
  if (answer.plies.length !== 1 || solution.plies.length !== 1) return false;
  const retro = toRetro(answer.plies[0]);
  const result = applyRetro(toFen(payload), retro);
  return result.ok && retroKey(retro) === retroKey(toRetro(solution.plies[0]));
}

/** Mode B: every answered ply must be a legal retro move on the previous prior position, and the last prior must meet the goal. */
function checkUnwind(payload: Payload, solution: Solution, answer: Answer) {
  if (!solution.goal || answer.plies.length !== payload.plyCount) return false;
  let position = toFen(payload);
  for (const ply of answer.plies) {
    const result = stepRetro(position, toRetro(ply));
    if (!result.ok) return false;
    position = result.prior;
  }
  return satisfiesGoal(position, solution.goal);
}

export function check(payload: Payload, solution: Solution, answer: Answer) {
  const correct =
    payload.mode === "last_move"
      ? checkLastMove(payload, solution, answer)
      : checkUnwind(payload, solution, answer);
  return { correct };
}
