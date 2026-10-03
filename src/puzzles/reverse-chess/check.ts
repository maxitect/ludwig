import { toFen } from "./derive";
import { applyRetro, retroKey, toRetro } from "./engine";
import type { Answer, Payload, SolutionPly } from "./schema";

/** Mode A: the single answered ply must be a legal retro move that equals the authored ply. */
export function check(payload: Payload, solution: SolutionPly[], answer: Answer) {
  if (payload.mode !== "last_move") {
    throw new Error("Mode B checking is implemented in T030");
  }
  if (answer.plies.length !== 1 || solution.length !== 1) {
    return { correct: false };
  }
  const retro = toRetro(answer.plies[0]);
  const result = applyRetro(toFen(payload), retro);
  return {
    correct:
      result.ok && retroKey(retro) === retroKey(toRetro(solution[0])),
  };
}
