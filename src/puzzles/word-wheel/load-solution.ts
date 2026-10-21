import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.wordWheelPuzzles.findFirst({
    where: { puzzleId },
    columns: { targetWord: true },
  });
  if (!puzzle) throw new Error(`Word wheel puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle.targetWord);
}
