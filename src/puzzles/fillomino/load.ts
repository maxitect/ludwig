import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.fillominoPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true },
    with: {
      givens: { columns: { row: true, col: true, digit: true } },
    },
  });
  if (!puzzle) throw new Error(`Fillomino puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
