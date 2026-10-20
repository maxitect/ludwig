import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  nonogramAttemptMarks,
  nonogramAttempts,
  nonogramCells,
  nonogramPuzzles,
} from "./tables";
import { shadedCells, verifyNonogram } from "./verify";

export const nonogramModule = {
  schema,
  meta: { key: "nonogram" },
  load,
  loadSolution,
  check,
  verify: verifyNonogram,
  async upsertContent(tx, puzzleId, content) {
    const { rows, cols, caption } = content;
    await tx
      .insert(nonogramPuzzles)
      .values({ puzzleId, rows, cols, caption })
      .onConflictDoUpdate({
        target: nonogramPuzzles.puzzleId,
        set: { rows, cols, caption },
      });
    const cells = shadedCells(content);
    await tx.delete(nonogramCells).where(
      and(
        eq(nonogramCells.puzzleId, puzzleId),
        sql`(${nonogramCells.row}, ${nonogramCells.col}) not in (${sql.join(
          cells.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`,
      ),
    );
    await tx
      .insert(nonogramCells)
      .values(cells.map((cell) => ({ ...cell, puzzleId })))
      .onConflictDoNothing();
  },
  async replaceAttemptState(tx, attemptId, { marks }) {
    await tx
      .delete(nonogramAttempts)
      .where(eq(nonogramAttempts.attemptId, attemptId));
    await tx.insert(nonogramAttempts).values({ attemptId });
    if (marks.length) {
      await tx
        .insert(nonogramAttemptMarks)
        .values(marks.map((mark) => ({ ...mark, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(nonogramAttempts)
      .where(eq(nonogramAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.nonogramAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { marks: { columns: { row: true, col: true, mark: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
