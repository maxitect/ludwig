import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.keywordPuzzles.findFirst({
    where: { puzzleId },
    columns: { plaintext: true, keyword: true },
  });
  if (!puzzle) throw new Error(`Keyword puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle);
}
