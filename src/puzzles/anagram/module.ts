import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import { anagramAttempts, anagramPuzzles } from "./tables";
import { verifyAnagram } from "./verify";

export const anagramModule = {
  schema,
  meta: { key: "anagram" },
  load,
  loadSolution,
  check,
  verify: verifyAnagram,
  async upsertContent(tx, puzzleId, content) {
    await tx
      .insert(anagramPuzzles)
      .values({ ...content, puzzleId })
      .onConflictDoUpdate({
        target: anagramPuzzles.puzzleId,
        set: {
          answer: content.answer,
          definitionHint: content.definitionHint ?? null,
          scrambleSeed: content.scrambleSeed,
        },
      });
  },
  async replaceAttemptState(tx, attemptId, { answer }) {
    await tx
      .delete(anagramAttempts)
      .where(eq(anagramAttempts.attemptId, attemptId));
    await tx.insert(anagramAttempts).values({ attemptId, answer });
  },
  async clearAttemptState(attemptId) {
    await db.delete(anagramAttempts).where(eq(anagramAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.anagramAttempts.findFirst({
      where: { attemptId },
      columns: { answer: true },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, string>;
