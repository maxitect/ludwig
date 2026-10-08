import { COMPASS } from "../_shared/highlight-path/path";
import type { Payload } from "./schema";

type Position = { row: number; col: number };
type Grid = Pick<Payload, "rows" | "cols" | "cells">;

/** The two end cells of a word's straight line. The word reads from `start` to `end`. */
export type Placement = { start: Position; end: Position };

export type WordPlacements = { word: string; placements: Placement[] };

const samePosition = (a: Position, b: Position) =>
  a.row === b.row && a.col === b.col;

/** True when both placements cover the same cells, whichever way each one reads. */
export function samePlacement(a: Placement, b: Placement) {
  return (
    (samePosition(a.start, b.start) && samePosition(a.end, b.end)) ||
    (samePosition(a.start, b.end) && samePosition(a.end, b.start))
  );
}

function letterAt({ cells }: Grid) {
  const letters = new Map(
    cells.map(({ row, col, letter }) => [`${row},${col}`, letter]),
  );
  return (row: number, col: number) => letters.get(`${row},${col}`);
}

/**
 * Every line of cells that spells `word`, in all eight compass directions. A line that reads the
 * word forwards and the same cells read backwards (a palindrome) count once.
 */
export function findPlacements(grid: Grid, word: string): Placement[] {
  const at = letterAt(grid);
  const found: Placement[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      for (const step of COMPASS) {
        const end = {
          row: row + step.row * (word.length - 1),
          col: col + step.col * (word.length - 1),
        };
        if (
          end.row < 0 ||
          end.row >= grid.rows ||
          end.col < 0 ||
          end.col >= grid.cols
        ) {
          continue;
        }
        const spells = [...word].every(
          (letter, i) =>
            at(row + step.row * i, col + step.col * i) === letter,
        );
        const placement = { start: { row, col }, end };
        if (spells && !found.some((other) => samePlacement(other, placement))) {
          found.push(placement);
        }
      }
    }
  }
  return found;
}

/** Where each word sits. A word with no placement was never hidden, and one with several is ambiguous. */
export function derivePlacements(
  grid: Grid,
  words: readonly string[],
): WordPlacements[] {
  return words.map((word) => ({ word, placements: findPlacements(grid, word) }));
}

/** The word a selection from `start` to `end` spells, in either direction, or null. */
export function matchSelection(
  derived: readonly WordPlacements[],
  start: Position,
  end: Position,
) {
  const selection = { start, end };
  return (
    derived.find(({ placements }) =>
      placements.some((placement) => samePlacement(placement, selection)),
    )?.word ?? null
  );
}
