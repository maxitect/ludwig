import { cellKey } from "../_shared/cell-grid/navigation";
import type { Answer, Payload, Solution } from "./schema";

/** Correct only when every white cell holds its digit; a digit on a black cell is wrong. */
export function check(_payload: Payload, solution: Solution, answer: Answer) {
  const entered = new Map(
    answer.cells.map(({ row, col, digit }) => [cellKey(row, col), digit]),
  );
  return {
    correct:
      entered.size === solution.length &&
      solution.every(
        ({ row, col, digit }) => entered.get(cellKey(row, col)) === digit,
      ),
  };
}
