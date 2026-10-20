import { countSolutions, layoutOf } from "./engine";
import type { Content } from "./schema";

/** The numbers of the written grid as `{ row, col, digit }`. */
export function numbers({ grid }: Pick<Content, "grid">) {
  return grid.flatMap((line, row) =>
    [...line].flatMap((char, col) =>
      char === "." ? [] : [{ row, col, digit: Number(char) }],
    ),
  );
}

/** The grid has exactly one set of nine circles. */
export function verifyCircle9({ grid }: Content) {
  const count = countSolutions(layoutOf({ numbers: numbers({ grid }) }));
  if (count !== 1) {
    throw new Error(
      count === 0
        ? "the puzzle has no solution"
        : "the puzzle has more than one solution",
    );
  }
}
