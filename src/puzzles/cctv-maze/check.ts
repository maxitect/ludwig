import { canStep } from "./derive";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Correct when the path runs from the start to the exit in single steps, through no wall and
 * over no seen cell. Any such path counts, not only the shortest. `firstInvalidStep` is the index
 * of the first cell that breaks a rule, or null when none does; it is computed server-side only
 * and never returned to the client, since it would tell the player which cells are seen.
 */
export function check(payload: Payload, solution: Solution, answer: Answer) {
  const seen = new Set(solution.seen.map(({ row, col }) => `${row},${col}`));
  const { path } = answer;
  const firstInvalidStep = path.findIndex((to, step) => {
    if (step === 0) {
      return to.row !== payload.startRow || to.col !== payload.startCol;
    }
    return (
      !canStep(payload, path[step - 1], to) || seen.has(`${to.row},${to.col}`)
    );
  });
  const last = path[path.length - 1];
  const reachedExit = last.row === payload.exitRow && last.col === payload.exitCol;
  return {
    correct: firstInvalidStep === -1 && reachedExit,
    firstInvalidStep: firstInvalidStep === -1 ? null : firstInvalidStep,
  };
}
