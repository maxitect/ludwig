import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.caesarPuzzles.findFirst({
    where: { puzzleId },
    columns: { plaintext: true, shift: true },
  });
  if (!puzzle) throw new Error(`Caesar puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle);
}
