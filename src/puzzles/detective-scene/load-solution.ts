import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.detectiveScenePuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      items: {
        columns: {
          position: true,
          title: true,
          x: true,
          y: true,
          width: true,
          height: true,
        },
        orderBy: { position: "asc" },
      },
      aliases: {
        columns: { position: true, alias: true },
        orderBy: { position: "asc", alias: "asc" },
      },
    },
  });
  if (!puzzle) {
    throw new Error(`Detective scene puzzle not found: ${puzzleId}`);
  }
  return solutionSchema.parse({ items: puzzle.items, aliases: puzzle.aliases });
}
