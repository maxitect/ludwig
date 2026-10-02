import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import { Solver } from "./solver";
import { anagramAttempts, anagramPuzzles } from "./tables";
import { verifyAnagram } from "./verify";

export const anagramModule = {
  schema,
  meta: { key: "anagram" },
  load,
  loadSolution,
  check,
  Solver,
  verify: verifyAnagram,
  async insertContent(tx, puzzleId, content) {
    await tx.insert(anagramPuzzles).values({ ...content, puzzleId });
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
