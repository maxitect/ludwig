import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import { caesarAttempts, caesarPuzzles } from "./tables";
import { verifyCaesar } from "./verify";

export const caesarModule = {
  schema,
  meta: { key: "caesar" },
  load,
  loadSolution,
  check,
  verify: verifyCaesar,
  async upsertContent(tx, puzzleId, content) {
    await tx
      .insert(caesarPuzzles)
      .values({ ...content, puzzleId })
      .onConflictDoUpdate({
        target: caesarPuzzles.puzzleId,
        set: { plaintext: content.plaintext, shift: content.shift },
      });
  },
  async replaceAttemptState(tx, attemptId, { answer }) {
    await tx
      .delete(caesarAttempts)
      .where(eq(caesarAttempts.attemptId, attemptId));
    await tx.insert(caesarAttempts).values({ attemptId, answer });
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(caesarAttempts)
      .where(eq(caesarAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.caesarAttempts.findFirst({
      where: { attemptId },
      columns: { answer: true },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
