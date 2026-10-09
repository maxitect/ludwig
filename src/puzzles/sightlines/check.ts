import type { Answer, Payload, Solution } from "./schema";

const key = (row: number, col: number) => `${row},${col}`;

/** Correct when the marked cells are exactly the blind spots; `cellsWrong` counts the missing and the extra. */
export function check(_payload: Payload, solution: Solution, answer: Answer) {
  const marked = new Set(answer.marks.map(({ row, col }) => key(row, col)));
  const blind = new Set(solution.map(({ row, col }) => key(row, col)));
  const extra = [...marked].filter((cell) => !blind.has(cell)).length;
  const missing = [...blind].filter((cell) => !marked.has(cell)).length;
  const cellsWrong = extra + missing;
  return { correct: cellsWrong === 0, cellsWrong };
}
