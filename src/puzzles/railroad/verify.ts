import { countSolutions } from "./engine";
import type { Content } from "./schema";

/** The counts agree on the number of track cells, and the clues have exactly one track. */
export function verifyRailroad(content: Content) {
  const sum = (counts: readonly number[]) => counts.reduce((a, b) => a + b, 0);
  if (sum(content.rowCounts) !== sum(content.colCounts)) {
    throw new Error("the row counts and column counts add up differently");
  }
  const count = countSolutions(content);
  if (count !== 1) {
    throw new Error(
      count === 0
        ? "the puzzle has no solution"
        : "the puzzle has more than one solution",
    );
  }
}
