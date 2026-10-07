import "server-only";
import { db } from "@/db";
import { isVariant } from "./derive";
import { loadSolution } from "./load-solution";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const [puzzle, solution] = await Promise.all([
    db.query.logicGridPuzzles.findFirst({
      where: { puzzleId },
      columns: {},
      with: {
        categories: {
          columns: { position: true, name: true },
          orderBy: { position: "asc" },
          with: {
            items: {
              columns: { id: true, position: true, label: true },
              orderBy: { position: "asc" },
            },
          },
        },
        clues: {
          columns: { position: true, content: true },
          orderBy: { position: "asc" },
        },
      },
    }),
    loadSolution(puzzleId),
  ]);
  if (!puzzle) throw new Error(`Logic grid puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({ ...puzzle, variant: isVariant(solution.clues) });
}
