import type { Cell, Payload } from "./schema";

/** The lengths of the runs of shaded cells in a line, in order. An empty line has none. */
export function runsOf(line: readonly boolean[]) {
  const runs: number[] = [];
  let length = 0;
  for (const shaded of line) {
    if (shaded) length++;
    else if (length) {
      runs.push(length);
      length = 0;
    }
  }
  if (length) runs.push(length);
  return runs;
}

/** The row and column clues of a picture, given as its shaded cells. */
export function cluesOf(
  rows: number,
  cols: number,
  cells: readonly Cell[],
): Pick<Payload, "rowClues" | "colClues"> {
  const shaded = Array.from({ length: rows }, () =>
    Array<boolean>(cols).fill(false),
  );
  for (const { row, col } of cells) shaded[row][col] = true;
  return {
    rowClues: shaded.map(runsOf),
    colClues: Array.from({ length: cols }, (_, col) =>
      runsOf(shaded.map((line) => line[col])),
    ),
  };
}
