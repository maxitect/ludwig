import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.gearTrainPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: { solutionCogs: { columns: { row: true, col: true, teeth: true } } },
  });
  if (!puzzle) throw new Error(`Gear train puzzle not found: ${puzzleId}`);
  return solutionSchema.parse({ cogs: puzzle.solutionCogs });
}
