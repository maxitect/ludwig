import "server-only";
import { db } from "@/db";
import { solutionPlySchema } from "./schema";

export async function loadSolution(puzzleId: string) {
  const plies = await db.query.reverseChessSolutionPlies.findMany({
    where: { puzzleId },
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
  });
  return solutionPlySchema.array().parse(plies);
}
