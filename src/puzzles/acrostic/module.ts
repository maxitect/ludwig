import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import { acrosticAttempts, acrosticLines, acrosticPuzzles } from "./tables";
import { verifyAcrostic } from "./verify";

export const acrosticModule = {
  schema,
  meta: { key: "acrostic" },
  load,
  loadSolution,
  check,
  verify: verifyAcrostic,
  async upsertContent(tx, puzzleId, { rule, lines }) {
    await tx
      .insert(acrosticPuzzles)
      .values({ puzzleId, rule })
      .onConflictDoUpdate({ target: acrosticPuzzles.puzzleId, set: { rule } });
    await tx
      .delete(acrosticLines)
      .where(
        and(
          eq(acrosticLines.puzzleId, puzzleId),
          gte(acrosticLines.position, lines.length),
        ),
      );
    await tx
      .insert(acrosticLines)
      .values(
        lines.map((content, position) => ({ puzzleId, position, content })),
      )
      .onConflictDoUpdate({
        target: [acrosticLines.puzzleId, acrosticLines.position],
        set: { content: sql`excluded.content` },
      });
  },
  async replaceAttemptState(tx, attemptId, { answer }) {
    await tx
      .delete(acrosticAttempts)
      .where(eq(acrosticAttempts.attemptId, attemptId));
    await tx.insert(acrosticAttempts).values({ attemptId, answer });
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(acrosticAttempts)
      .where(eq(acrosticAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.acrosticAttempts.findFirst({
      where: { attemptId },
      columns: { answer: true },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
