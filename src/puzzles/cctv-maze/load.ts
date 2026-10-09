import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.cctvMazePuzzles.findFirst({
    where: { puzzleId },
    columns: {
      puzzleId: true,
      rows: true,
      cols: true,
      startRow: true,
      startCol: true,
      exitRow: true,
      exitCol: true,
    },
    with: {
      walls: {
        columns: { row: true, col: true, side: true },
        orderBy: { row: "asc", col: "asc", side: "asc" },
      },
      cameras: {
        columns: {
          row: true,
          col: true,
          facing: true,
          fovDeg: true,
          rangeCells: true,
        },
        orderBy: { row: "asc", col: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`CCTV maze not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
