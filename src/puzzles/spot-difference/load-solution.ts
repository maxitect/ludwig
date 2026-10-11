import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.spotDifferencePuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      differences: {
        columns: {
          differenceIndex: true,
          x: true,
          y: true,
          width: true,
          height: true,
        },
        orderBy: { differenceIndex: "asc" },
      },
    },
  });
  if (!puzzle) {
    throw new Error(`Spot the difference puzzle not found: ${puzzleId}`);
  }
  return solutionSchema.parse(
    puzzle.differences.map(({ differenceIndex, ...region }) => ({
      index: differenceIndex,
      region,
    })),
  );
}
