import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  napkinMathsAttempts,
  napkinMathsLines,
  napkinMathsPuzzles,
} from "./tables";
import { verifyNapkinMaths } from "./verify";

export const napkinMathsModule = {
  schema,
  meta: { key: "napkin-maths" },
  load,
  loadSolution,
  check,
  verify: verifyNapkinMaths,
  async upsertContent(tx, puzzleId, { questionText, answer, lines }) {
    await tx
      .insert(napkinMathsPuzzles)
      .values({ puzzleId, questionText, answer })
      .onConflictDoUpdate({
        target: napkinMathsPuzzles.puzzleId,
        set: { questionText, answer },
      });
    await tx
      .insert(napkinMathsLines)
      .values(lines.map((content, position) => ({ puzzleId, position, content })))
      .onConflictDoUpdate({
        target: [napkinMathsLines.puzzleId, napkinMathsLines.position],
        set: { content: sql`excluded.content` },
      });
    await tx
      .delete(napkinMathsLines)
      .where(
        and(
          eq(napkinMathsLines.puzzleId, puzzleId),
          gte(napkinMathsLines.position, lines.length),
        ),
      );
  },
  async replaceAttemptState(tx, attemptId, { answer }) {
    await tx
      .delete(napkinMathsAttempts)
      .where(eq(napkinMathsAttempts.attemptId, attemptId));
    await tx.insert(napkinMathsAttempts).values({ attemptId, answer });
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(napkinMathsAttempts)
      .where(eq(napkinMathsAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.napkinMathsAttempts.findFirst({
      where: { attemptId },
      columns: { answer: true },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, string>;
