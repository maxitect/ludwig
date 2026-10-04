import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.crosswordPuzzles.findFirst({
    where: { puzzleId },
    columns: { style: true, rows: true, cols: true },
    with: {
      cells: { columns: { row: true, col: true } },
      clues: {
        columns: { direction: true, row: true, col: true, clueText: true },
        with: {
          segments: {
            columns: { length: true, separator: true },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });
  if (!puzzle) throw new Error(`Crossword puzzle not found: ${puzzleId}`);
  return payloadSchema.parse(puzzle);
}
