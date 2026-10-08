import { derivePlacements, samePlacement } from "./derive";
import type { Content } from "./schema";

/** Every hidden word must sit in the grid exactly once, on its own line of cells, in a full rectangular grid. */
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
  const derived = derivePlacements({ rows: grid.length, cols, cells }, words);
  for (const [i, { word, placements }] of derived.entries()) {
    if (placements.length !== 1) {
      throw new Error(
        placements.length === 0
          ? `"${word}" does not appear in the grid`
          : `"${word}" appears ${placements.length} times in the grid`,
      );
    }
    const twin = derived
      .slice(0, i)
      .find((other) => samePlacement(other.placements[0], placements[0]));
    if (twin) {
      throw new Error(
        `"${word}" and "${twin.word}" are the same letters read both ways`,
      );
    }
  }
}
