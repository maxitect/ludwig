import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.circle9Puzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: { numbers: { columns: { row: true, col: true, digit: true } } },
  });
  if (!puzzle) throw new Error(`Circle9 puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
