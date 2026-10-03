import { cellKey } from "../_shared/cell-grid/navigation";
import type { Answer, Payload, Solution } from "./schema";

export function check(_payload: Payload, solution: Solution, answer: Answer) {
  const entered = new Map(
    answer.cells.map(({ row, col, letter }) => [cellKey(row, col), letter]),
  );
  return {
    correct:
      entered.size === solution.length &&
      solution.every(
        ({ row, col, letter }) => entered.get(cellKey(row, col)) === letter,
      ),
  };
}

export function checkCell(
  _payload: Payload,
  solution: Solution,
  row: number,
  col: number,
  value: string,
) {
  const cell = solution.find((c) => c.row === row && c.col === col);
  return { correct: cell?.letter === value.toUpperCase() };
}

export function revealCell(solution: Solution, row: number, col: number) {
  return solution.find((c) => c.row === row && c.col === col)?.letter ?? null;
}
