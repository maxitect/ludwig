import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.norinoriPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true },
    with: {
      regionCells: { columns: { row: true, col: true, region: true } },
    },
  });
  if (!puzzle) throw new Error(`Norinori puzzle not found: ${puzzleId}`);
  const { regionCells, ...rest } = puzzle;
  return payloadSchema.parse({ ...rest, regions: regionCells });
}
