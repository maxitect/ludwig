import { cluesOf } from "./derive";
import { countSolutions } from "./engine";
import type { Content } from "./schema";

/** The shaded cells of the written picture as `{ row, col }`. */
export function shadedCells({ grid }: Pick<Content, "grid">) {
  return grid.flatMap((line, row) =>
    [...line].flatMap((char, col) => (char === "#" ? [{ row, col }] : [])),
  );
}

/** The grid has `rows × cols` cells, at least one shaded, and the clues it gives have exactly one picture. */
export function verifyNonogram({ rows, cols, grid }: Content) {
  if (grid.length !== rows) {
    throw new Error(`the grid has ${grid.length} rows, not ${rows}`);
  }
  const ragged = grid.findIndex((line) => line.length !== cols);
  if (ragged !== -1) {
    throw new Error(
      `row ${ragged + 1} has ${grid[ragged].length} cells, not ${cols}`,
    );
  }
  const cells = shadedCells({ grid });
  if (!cells.length) throw new Error("the picture has no shaded cell");
  const count = countSolutions(cluesOf(rows, cols, cells));
  if (count !== 1) {
    throw new Error(
      count === 0
        ? "the puzzle has no solution"
        : "the puzzle has more than one solution",
    );
  }
}
