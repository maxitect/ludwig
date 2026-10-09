import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const solution = await db.query.oddOneOutSolutions.findFirst({
    where: { puzzleId },
    columns: { itemPosition: true, explanation: true },
  });
  if (!solution) throw new Error(`Odd one out puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(solution);
}
