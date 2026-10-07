import "server-only";
import { db } from "@/db";
import { solutionSchema } from "./schema";

/** No column holds the message: it is the glyphs' letters, read in order. */
export async function loadSolution(puzzleId: string) {
  const puzzle = await db.query.pictogramCipherPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      symbols: {
        columns: { wordIndex: true },
        with: { glyph: { columns: { letter: true } } },
        orderBy: { wordIndex: "asc", position: "asc" },
      },
    },
  });
  if (!puzzle) throw new Error(`Pictogram puzzle not found: ${puzzleId}`);
  const words: string[][] = [];
  for (const { wordIndex, glyph } of puzzle.symbols) {
    (words[wordIndex] ??= []).push(glyph.letter);
  }
  return solutionSchema.parse({ words });
}
