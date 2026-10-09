import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.napkinMathsPuzzles.findFirst({
    where: { puzzleId },
    columns: { answer: true },
  });
  if (!puzzle) throw new Error(`Napkin maths puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle.answer);
}
