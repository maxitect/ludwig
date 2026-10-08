import { derivePlacements } from "./derive";
import type { Content } from "./schema";

/** Every hidden word must sit in the grid exactly once, in a full rectangular grid. */
export function verifyWordSearch({ grid, words }: Content) {
  const cols = grid[0].length;
  const ragged = grid.findIndex((line) => line.length !== cols);
  if (ragged !== -1) {
    throw new Error(
      `grid is not full: row ${ragged + 1} has ${grid[ragged].length} letters, row 1 has ${cols}`,
    );
  }
  const duplicate = words.find((word, i) => words.indexOf(word) !== i);
  if (duplicate) throw new Error(`"${duplicate}" is listed twice`);
  const cells = grid.flatMap((line, row) =>
    [...line].map((letter, col) => ({ row, col, letter })),
  );
  for (const { word, placements } of derivePlacements(
    { rows: grid.length, cols, cells },
    words,
  )) {
    if (placements.length !== 1) {
      throw new Error(
        placements.length === 0
          ? `"${word}" does not appear in the grid`
          : `"${word}" appears ${placements.length} times in the grid`,
      );
    }
  }
}
