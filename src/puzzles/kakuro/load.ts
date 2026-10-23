import "server-only";
import { db } from "@/db";
import { deriveClues } from "./derive";
import { loadSolution } from "./load-solution";
import { payloadSchema } from "./schema";

/** The clues are derived from the stored digits, which stay on the server. */
export async function load(puzzleId: string) {
  const puzzle = await db.query.kakuroPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true },
  });
  if (!puzzle) throw new Error(`Kakuro puzzle not found: ${puzzleId}`);
  const solution = await loadSolution(puzzleId);
  return payloadSchema.parse({
    ...puzzle,
    cells: solution.map(({ row, col }) => ({ row, col })),
    clues: deriveClues(solution),
  });
}
