import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.reverseChessPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      solutionPlies: {
        columns: {
          fromFile: true,
          fromRank: true,
          toFile: true,
          toRank: true,
          uncapture: true,
          unpromote: true,
          special: true,
        },
        orderBy: { ply: "asc" },
      },
      goal: {
        columns: { kind: true },
        with: {
          pieceOnSquare: {
            columns: { colour: true, piece: true, file: true, rank: true },
          },
          castlingRight: { columns: { colour: true, side: true } },
          pieceCount: { columns: { colour: true, piece: true, count: true } },
        },
      },
    },
  });
  if (!puzzle) throw new Error(`Reverse chess puzzle not found: ${puzzleId}`);
  const { goal, solutionPlies } = puzzle;
  return solutionSchema.parse({
    plies: solutionPlies,
    goal: goal && {
      kind: goal.kind,
      ...goal.pieceOnSquare,
      ...goal.castlingRight,
      ...goal.pieceCount,
    },
  });
}
