import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.starBattlePuzzles.findFirst({
    where: { puzzleId },
    columns: { size: true, stars: true },
    with: {
      regionCells: { columns: { row: true, col: true, region: true } },
    },
  });
  if (!puzzle) throw new Error(`Star battle puzzle not found: ${puzzleId}`);
  const { regionCells, ...rest } = puzzle;
  return payloadSchema.parse({ ...rest, regions: regionCells });
}
