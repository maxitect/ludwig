import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, words } from "@/db/schema";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { deriveWheel, fits } from "./engine";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  wordWheelAttemptWords,
  wordWheelAttempts,
  wordWheelPuzzles,
} from "./tables";
import { verifyWordWheel } from "./verify";

export const wordWheelModule = {
  schema,
  meta: { key: "word-wheel" },
  load,
  loadSolution,
  check,
  verify: verifyWordWheel,
  async upsertContent(tx, puzzleId, content) {
    await tx
      .insert(wordWheelPuzzles)
      .values({ ...content, puzzleId })
      .onConflictDoUpdate({
        target: wordWheelPuzzles.puzzleId,
        set: {
          targetWord: sql`excluded.target_word`,
          centrePosition: sql`excluded.centre_position`,
          scrambleSeed: sql`excluded.scramble_seed`,
          minLength: sql`excluded.min_length`,
        },
      });
  },
  /** Keeps only the words that fit this puzzle's wheel and are in the dictionary. */
  async replaceAttemptState(tx, attemptId, { words: found }) {
    await tx
      .delete(wordWheelAttempts)
      .where(eq(wordWheelAttempts.attemptId, attemptId));
    await tx.insert(wordWheelAttempts).values({ attemptId });
    const [puzzle] = await tx
      .select({
        targetWord: wordWheelPuzzles.targetWord,
        centrePosition: wordWheelPuzzles.centrePosition,
        scrambleSeed: wordWheelPuzzles.scrambleSeed,
        minLength: wordWheelPuzzles.minLength,
      })
      .from(attempts)
      .innerJoin(
        wordWheelPuzzles,
        eq(wordWheelPuzzles.puzzleId, attempts.puzzleId),
      )
      .where(eq(attempts.id, attemptId));
    const wheel = deriveWheel(
      puzzle.targetWord,
      puzzle.centrePosition,
      puzzle.scrambleSeed,
    );
    const playable = [...new Set(found)].filter((word) =>
      fits(wheel, puzzle.minLength, word),
    );
    if (!playable.length) return;
    const known = await tx
      .select({ word: words.word })
      .from(words)
      .where(inArray(words.word, playable));
    if (!known.length) return;
    await tx
      .insert(wordWheelAttemptWords)
      .values(known.map(({ word }) => ({ attemptId, word })));
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(wordWheelAttempts)
      .where(eq(wordWheelAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.wordWheelAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        words: { columns: { word: true }, orderBy: { word: "asc" } },
      },
    });
    return attempt
      ? schema.attemptSchema.parse({
          words: attempt.words.map(({ word }) => word),
        })
      : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
