import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.kakuroPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: { cells: { columns: { row: true, col: true, digit: true } } },
  });
  if (!puzzle) throw new Error(`Kakuro puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle.cells);
}
