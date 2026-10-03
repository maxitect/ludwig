import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.crosswordPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: { cells: { columns: { row: true, col: true, letter: true } } },
  });
  if (!puzzle) throw new Error(`Crossword puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle.cells);
}
