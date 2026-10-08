import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  wordSearchAttemptFound,
  wordSearchAttempts,
  wordSearchCells,
  wordSearchPuzzles,
  wordSearchWords,
} from "./tables";
import { verifyWordSearch } from "./verify";

export const wordSearchModule = {
  schema,
  meta: { key: "word-search" },
  load,
  loadSolution,
  check,
  verify: verifyWordSearch,
  async upsertContent(tx, puzzleId, { grid, words }) {
    const rows = grid.length;
    const cols = grid[0].length;
    await tx
      .insert(wordSearchPuzzles)
      .values({ puzzleId, rows, cols })
      .onConflictDoUpdate({
        target: wordSearchPuzzles.puzzleId,
        set: { rows, cols },
      });
    await tx.delete(wordSearchCells).where(
      and(
        eq(wordSearchCells.puzzleId, puzzleId),
        sql`(${wordSearchCells.row} >= ${rows} or ${wordSearchCells.col} >= ${cols})`,
      ),
    );
    await tx
      .insert(wordSearchCells)
      .values(
        grid.flatMap((line, row) =>
          [...line].map((letter, col) => ({ puzzleId, row, col, letter })),
        ),
      )
      .onConflictDoUpdate({
        target: [
          wordSearchCells.puzzleId,
          wordSearchCells.row,
          wordSearchCells.col,
        ],
        set: { letter: sql`excluded.letter` },
      });
    await tx
      .delete(wordSearchWords)
      .where(
        and(
          eq(wordSearchWords.puzzleId, puzzleId),
          notInArray(wordSearchWords.word, words),
        ),
      );
    await tx
      .insert(wordSearchWords)
      .values(words.map((word) => ({ puzzleId, word })))
      .onConflictDoNothing();
  },
  async replaceAttemptState(tx, attemptId, { found }) {
    await tx
      .delete(wordSearchAttempts)
      .where(eq(wordSearchAttempts.attemptId, attemptId));
    await tx.insert(wordSearchAttempts).values({ attemptId });
    if (found.length) {
      await tx
        .insert(wordSearchAttemptFound)
        .values(found.map((word) => ({ attemptId, word })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(wordSearchAttempts)
      .where(eq(wordSearchAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.wordSearchAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        found: { columns: { word: true }, orderBy: { word: "asc" } },
      },
    });
    return attempt
      ? schema.attemptSchema.parse({
          found: attempt.found.map(({ word }) => word),
        })
      : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
