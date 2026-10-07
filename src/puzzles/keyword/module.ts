import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import { keywordAttempts, keywordPuzzles } from "./tables";
import { verifyKeyword } from "./verify";

export const keywordModule = {
  schema,
  meta: { key: "keyword" },
  load,
  loadSolution,
  check,
  verify: verifyKeyword,
  async upsertContent(tx, puzzleId, content) {
    await tx
      .insert(keywordPuzzles)
      .values({ ...content, puzzleId })
      .onConflictDoUpdate({
        target: keywordPuzzles.puzzleId,
        set: { plaintext: content.plaintext, keyword: content.keyword },
      });
  },
  async replaceAttemptState(tx, attemptId, { answer }) {
    await tx
      .delete(keywordAttempts)
      .where(eq(keywordAttempts.attemptId, attemptId));
    await tx.insert(keywordAttempts).values({ attemptId, answer });
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(keywordAttempts)
      .where(eq(keywordAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.keywordAttempts.findFirst({
      where: { attemptId },
      columns: { answer: true },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
