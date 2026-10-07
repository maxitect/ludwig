import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.logicGridPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      links: { columns: { itemAId: true, itemBId: true } },
      clues: { columns: { position: true, isFalse: true } },
    },
  });
  if (!puzzle) throw new Error(`Logic grid puzzle not found: ${puzzleId}`);
  return solutionSchema.parse(puzzle);
}
