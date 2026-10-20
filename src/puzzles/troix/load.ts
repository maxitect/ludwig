import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.troixPuzzles.findFirst({
    where: { puzzleId },
    columns: { size: true },
    with: {
      givens: { columns: { row: true, col: true, symbol: true } },
    },
  });
  if (!puzzle) throw new Error(`Troix puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
