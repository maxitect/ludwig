import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const characters = await db.query.knightsKnavesCharacters.findMany({
    where: { puzzleId },
    columns: { position: true, role: true },
    orderBy: { position: "asc" },
  });
  if (characters.length === 0) {
    throw new Error(`Knights and knaves puzzle not found: ${puzzleId}`);
  }
  return solutionSchema.parse(characters);
}
