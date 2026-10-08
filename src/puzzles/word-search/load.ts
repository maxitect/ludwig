import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.wordSearchPuzzles.findFirst({
    where: { puzzleId },
    columns: { rows: true, cols: true },
    with: {
      cells: {
        columns: { row: true, col: true, letter: true },
        orderBy: { row: "asc", col: "asc" },
      },
      words: { columns: { word: true }, orderBy: { word: "asc" } },
    },
  });
  if (!puzzle) throw new Error(`Word search puzzle not found: ${puzzleId}`);
  return payloadSchema.parse({
    ...puzzle,
    words: puzzle.words.map(({ word }) => word),
  });
}
