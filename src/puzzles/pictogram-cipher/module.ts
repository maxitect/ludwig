import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule, Tx } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  pictogramCipherAttemptGuesses,
  pictogramCipherAttempts,
  pictogramCipherGivenGlyphs,
  pictogramCipherPuzzles,
  pictogramCipherSymbols,
  pictogramGlyphs,
} from "./tables";
import { verifyPictogramCipher } from "./verify";

async function glyphIdsBy<K extends "letter" | "assetKey">(
  tx: Tx,
  column: K,
  values: string[],
) {
  const rows = await tx
    .select({
      id: pictogramGlyphs.id,
      letter: pictogramGlyphs.letter,
      assetKey: pictogramGlyphs.assetKey,
    })
    .from(pictogramGlyphs)
    .where(inArray(pictogramGlyphs[column], values));
  const byValue = new Map(rows.map((row) => [row[column], row.id]));
  return (value: string) => {
    const id = byValue.get(value);
    if (id === undefined) throw new Error(`Unknown glyph ${column}: ${value}`);
    return id;
  };
}

export const pictogramCipherModule = {
  schema,
  meta: { key: "pictogram-cipher" },
  load,
  loadSolution,
  check,
  verify: verifyPictogramCipher,
  async upsertContent(tx, puzzleId, { plaintext, given }) {
    const words = plaintext.split(" ").map((word) => [...word]);
    const glyphId = await glyphIdsBy(tx, "letter", [
      ...new Set([...given, ...words.flat()]),
    ]);
    await tx
      .insert(pictogramCipherPuzzles)
      .values({ puzzleId })
      .onConflictDoNothing();
    await tx
      .delete(pictogramCipherSymbols)
      .where(eq(pictogramCipherSymbols.puzzleId, puzzleId));
    await tx
      .delete(pictogramCipherGivenGlyphs)
      .where(eq(pictogramCipherGivenGlyphs.puzzleId, puzzleId));
    await tx.insert(pictogramCipherSymbols).values(
      words.flatMap((word, wordIndex) =>
        word.map((letter, position) => ({
          puzzleId,
          wordIndex,
          position,
          glyphId: glyphId(letter),
        })),
      ),
    );
    await tx.insert(pictogramCipherGivenGlyphs).values(
      given.map((letter) => ({ puzzleId, glyphId: glyphId(letter) })),
    );
  },
  async replaceAttemptState(tx, attemptId, { guesses }) {
    await tx
      .delete(pictogramCipherAttempts)
      .where(eq(pictogramCipherAttempts.attemptId, attemptId));
    await tx.insert(pictogramCipherAttempts).values({ attemptId });
    if (!guesses.length) return;
    const glyphId = await glyphIdsBy(
      tx,
      "assetKey",
      guesses.map(({ assetKey }) => assetKey),
    );
    await tx.insert(pictogramCipherAttemptGuesses).values(
      guesses.map(({ assetKey, letter }) => ({
        attemptId,
        glyphId: glyphId(assetKey),
        letter,
      })),
    );
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(pictogramCipherAttempts)
      .where(eq(pictogramCipherAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.pictogramCipherAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        guesses: {
          columns: { letter: true },
          with: { glyph: { columns: { assetKey: true } } },
          orderBy: { glyphId: "asc" },
        },
      },
    });
    return attempt
      ? schema.attemptSchema.parse({
          guesses: attempt.guesses.map(({ letter, glyph }) => ({
            letter,
            assetKey: glyph.assetKey,
          })),
        })
      : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
