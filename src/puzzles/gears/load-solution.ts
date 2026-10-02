import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const solution = await db.query.gearSolutions.findFirst({
    where: { puzzleId },
    columns: { crank: true, convergence: true, killerGearId: true },
    with: {
      swaps: {
        columns: { gearAId: true, gearBId: true },
        orderBy: { gearAId: "asc", gearBId: "asc" },
      },
    },
  });
  if (!solution) throw new Error(`Gear solution not found: ${puzzleId}`);
  return solutionSchema.parse(solution);
}
