import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const solution = await db.query.rotaSolutions.findFirst({
    where: { puzzleId },
    columns: { instigatorWorkerId: true },
    with: {
      swaps: {
        columns: { workerAId: true, workerBId: true },
        orderBy: { step: "asc" },
      },
    },
  });
  if (!solution) throw new Error(`Rota solution not found: ${puzzleId}`);
  return solutionSchema.parse(solution);
}
