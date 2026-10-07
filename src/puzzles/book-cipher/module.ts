import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  bookCipherAttempts,
  bookCipherPuzzles,
  bookCipherRefs,
  bookTexts,
} from "./tables";
import { verifyBookCipher } from "./verify";

export const bookCipherModule = {
  schema,
  meta: { key: "book-cipher" },
  load,
  loadSolution,
  check,
  verify: verifyBookCipher,
  async upsertContent(tx, puzzleId, { textSlug, refs }) {
    const [text] = await tx
      .select({ id: bookTexts.id })
      .from(bookTexts)
      .where(eq(bookTexts.slug, textSlug));
    if (!text) throw new Error(`Book text not found: ${textSlug}`);

    await tx
      .delete(bookCipherRefs)
      .where(
        and(
          eq(bookCipherRefs.puzzleId, puzzleId),
          ne(bookCipherRefs.textId, text.id),
        ),
      );
    await tx
      .insert(bookCipherPuzzles)
      .values({ puzzleId, textId: text.id })
      .onConflictDoUpdate({
        target: bookCipherPuzzles.puzzleId,
        set: { textId: sql`excluded.text_id` },
      });
    await tx
      .delete(bookCipherRefs)
      .where(
        and(
          eq(bookCipherRefs.puzzleId, puzzleId),
          sql`${bookCipherRefs.position} >= ${refs.length}`,
        ),
      );
    await tx
      .insert(bookCipherRefs)
      .values(refs.map((ref, position) => ({ ...ref, puzzleId, position })))
      .onConflictDoUpdate({
        target: [bookCipherRefs.puzzleId, bookCipherRefs.position],
        set: {
          page: sql`excluded.page`,
          line: sql`excluded.line`,
          wordIndex: sql`excluded.word_index`,
        },
      });
  },
  async replaceAttemptState(tx, attemptId, { answer }) {
    await tx
      .delete(bookCipherAttempts)
      .where(eq(bookCipherAttempts.attemptId, attemptId));
    await tx.insert(bookCipherAttempts).values({ attemptId, answer });
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(bookCipherAttempts)
      .where(eq(bookCipherAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.bookCipherAttempts.findFirst({
      where: { attemptId },
      columns: { answer: true },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
