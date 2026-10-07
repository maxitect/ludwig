import "server-only";
import { db } from "@/db";
import { payloadSchema } from "./schema";

/**
 * Glyph asset keys for every symbol, and the letters of the given glyphs only. No other glyph's
 * letter is selected, so the full mapping never reaches the client.
 */
export async function load(puzzleId: string) {
  const puzzle = await db.query.pictogramCipherPuzzles.findFirst({
    where: { puzzleId },
    columns: {},
    with: {
      symbols: {
        columns: { wordIndex: true },
        with: { glyph: { columns: { assetKey: true } } },
        orderBy: { wordIndex: "asc", position: "asc" },
      },
      givenGlyphs: {
        columns: {},
        with: { glyph: { columns: { assetKey: true, letter: true } } },
      },
    },
  });
  if (!puzzle) throw new Error(`Pictogram puzzle not found: ${puzzleId}`);
  const words: string[][] = [];
  for (const { wordIndex, glyph } of puzzle.symbols) {
    (words[wordIndex] ??= []).push(glyph.assetKey);
  }
  return payloadSchema.parse({
    words,
    given: puzzle.givenGlyphs.map(({ glyph }) => glyph),
  });
}
