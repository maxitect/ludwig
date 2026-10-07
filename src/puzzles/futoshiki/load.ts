import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.futoshikiPuzzles.findFirst({
    where: { puzzleId },
    columns: { size: true },
    with: {
      givens: { columns: { row: true, col: true, digit: true } },
      inequalities: {
        columns: { row: true, col: true, direction: true, relation: true },
      },
    },
  });
  if (!puzzle) throw new Error(`Futoshiki puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
