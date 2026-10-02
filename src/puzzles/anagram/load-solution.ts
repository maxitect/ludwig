import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.anagramPuzzles.findFirst({
    where: { puzzleId },
    columns: { answer: true },
  });
  if (!puzzle) throw new Error(`Anagram puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle.answer);
}
