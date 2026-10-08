import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.wordLadderPuzzles.findFirst({
    where: { puzzleId },
    columns: { startWord: true, endWord: true, rungCount: true },
  });
  if (!puzzle) throw new Error(`Word ladder puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
