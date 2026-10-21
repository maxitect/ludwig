import { cellAt, indexOf, pieceMap, trace } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/**
 * Any track that obeys SPEC §2.4 is correct, so nothing is compared with the solution: one path
 * from the entry to the exit, no piece off it, the row and column counts met, and every given piece
 * kept. Wrong cells are the ones a rule points at: a given piece that was changed or left out, a
 * piece off the path (a separate loop included), the cell where the path stops short, a path cell a
 * stray piece opens onto, and the pieces in a row or column over its count.
 */
export function check(payload: Payload, _solution: Solution, answer: Answer) {
  const { rows, cols, rowCounts, colCounts, given } = payload;
  const map = pieceMap(payload, answer.pieces);
  const placed = [...map].map(([index, piece]) => ({
    ...cellAt(cols, index),
    piece,
  }));
  const { path, reachesExit, breakAt, strays, branches } = trace(
    payload,
    placed,
  );

  const wrong = new Set<number>();
  const mark = (cell: { row: number; col: number }) =>
    wrong.add(indexOf(cols, cell));
  const changed = given.filter(
    ({ row, col, piece }) => map.get(row * cols + col) !== piece,
  );
  changed.forEach(mark);
  strays.forEach(mark);
  branches.forEach(mark);
  if (breakAt) mark(breakAt);

  const rowTotals = new Array<number>(rows).fill(0);
  const colTotals = new Array<number>(cols).fill(0);
  for (const { row, col } of placed) {
    rowTotals[row]++;
    colTotals[col]++;
  }
  for (const { row, col } of placed) {
    if (rowTotals[row] > rowCounts[row] || colTotals[col] > colCounts[col]) {
      mark({ row, col });
    }
  }
  const countsMet =
    rowTotals.every((n, row) => n === rowCounts[row]) &&
    colTotals.every((n, col) => n === colCounts[col]);

  return {
    correct:
      reachesExit &&
      path.length === placed.length &&
      countsMet &&
      changed.length === 0,
    wrongParts: [...wrong].sort((a, b) => a - b).map((i) => cellAt(cols, i)),
  };
}
