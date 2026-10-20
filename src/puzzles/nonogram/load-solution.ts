import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.nonogramPuzzles.findFirst({
    where: { puzzleId },
    columns: { caption: true },
    with: { cells: { columns: { row: true, col: true } } },
  });
  if (!puzzle) throw new Error(`Nonogram puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle);
}
