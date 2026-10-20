import "server-only";
import { db } from "@/db";
import { cluesOf } from "./derive";
import { loadSolution } from "./load-solution";
import { payloadSchema } from "./schema";

/** The clues are derived from the stored picture. Only they and the size reach the payload. */
export async function load(puzzleId: string) {
  const puzzle = await db.query.nonogramPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true },
  });
  if (!puzzle) throw new Error(`Nonogram puzzle not found: ${puzzleId}`);
  const { cells } = await loadSolution(puzzleId);
  return payloadSchema.parse({
    ...puzzle,
    ...cluesOf(puzzle.rows, puzzle.cols, cells),
  });
}
