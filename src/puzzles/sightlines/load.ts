import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.sightlinesPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true, targetRow: true, targetCol: true },
    with: {
      obstacles: {
        columns: { row: true, col: true },
        orderBy: { row: "asc", col: "asc" },
      },
      observers: {
        columns: { row: true, col: true, facing: true, fovDeg: true },
        orderBy: { row: "asc", col: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Sightlines puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
