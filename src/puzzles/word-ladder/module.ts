import { eq, gte, and, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  wordLadderAttemptRungs,
  wordLadderAttempts,
  wordLadderPuzzles,
  wordLadderSolutionRungs,
} from "./tables";
import { verifyWordLadder } from "./verify";

export const wordLadderModule = {
  schema,
  meta: { key: "word-ladder" },
  load,
  loadSolution,
  check,
  verify: verifyWordLadder,
  async upsertContent(tx, puzzleId, { startWord, endWord, rungs }) {
    await tx
      .insert(wordLadderPuzzles)
      .values({ puzzleId, startWord, endWord, rungCount: rungs.length })
      .onConflictDoUpdate({
        target: wordLadderPuzzles.puzzleId,
        set: {
          startWord: sql`excluded.start_word`,
          endWord: sql`excluded.end_word`,
          rungCount: sql`excluded.rung_count`,
        },
      });
    await tx
      .delete(wordLadderSolutionRungs)
      .where(
        and(
          eq(wordLadderSolutionRungs.puzzleId, puzzleId),
          gte(wordLadderSolutionRungs.position, rungs.length),
        ),
      );
    await tx
      .insert(wordLadderSolutionRungs)
      .values(rungs.map((word, position) => ({ puzzleId, position, word })))
      .onConflictDoUpdate({
        target: [
          wordLadderSolutionRungs.puzzleId,
          wordLadderSolutionRungs.position,
        ],
        set: { word: sql`excluded.word` },
      });
  },
  async replaceAttemptState(tx, attemptId, { rungs }) {
    await tx
      .delete(wordLadderAttempts)
      .where(eq(wordLadderAttempts.attemptId, attemptId));
    await tx.insert(wordLadderAttempts).values({ attemptId });
    if (rungs.length) {
      await tx
        .insert(wordLadderAttemptRungs)
        .values(rungs.map((rung) => ({ ...rung, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(wordLadderAttempts)
      .where(eq(wordLadderAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.wordLadderAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        rungs: {
          columns: { position: true, word: true },
          orderBy: { position: "asc" },
        },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
