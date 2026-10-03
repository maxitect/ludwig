import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.spotDifferencePuzzles.findFirst({
    where: { puzzleId },
    columns: { sceneSeed: true, differenceCount: true, generatorVersion: true },
  });
  if (!puzzle) {
    throw new Error(`Spot the difference puzzle not found: ${puzzleId}`);
  }
  return solutionSchema.parse(puzzle);
}
