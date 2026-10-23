import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  fillominoAttemptCells,
  fillominoAttempts,
  fillominoGivens,
  fillominoPuzzles,
} from "./tables";
import { verifyFillomino } from "./verify";

export const fillominoModule = {
  schema,
  meta: { key: "fillomino" },
  load,
  loadSolution,
  check,
  verify: verifyFillomino,
  async upsertContent(tx, puzzleId, { rows, cols, givens }) {
    await tx
      .insert(fillominoPuzzles)
      .values({ puzzleId, rows, cols })
      .onConflictDoUpdate({
        target: fillominoPuzzles.puzzleId,
        set: { rows: sql`excluded.rows`, cols: sql`excluded.cols` },
      });

    const keptGivens = givens.length
      ? sql`(${fillominoGivens.row}, ${fillominoGivens.col}) not in (${sql.join(
          givens.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`
      : undefined;
    await tx
      .delete(fillominoGivens)
      .where(and(eq(fillominoGivens.puzzleId, puzzleId), keptGivens));
    if (givens.length) {
      await tx
        .insert(fillominoGivens)
        .values(givens.map((given) => ({ ...given, puzzleId })))
        .onConflictDoUpdate({
          target: [
            fillominoGivens.puzzleId,
            fillominoGivens.row,
            fillominoGivens.col,
          ],
          set: { digit: sql`excluded.digit` },
        });
    }
  },
  async replaceAttemptState(tx, attemptId, { cells }) {
    await tx
      .delete(fillominoAttempts)
      .where(eq(fillominoAttempts.attemptId, attemptId));
    await tx.insert(fillominoAttempts).values({ attemptId });
    if (cells.length) {
      await tx
        .insert(fillominoAttemptCells)
        .values(cells.map((cell) => ({ ...cell, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(fillominoAttempts)
      .where(eq(fillominoAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.fillominoAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { cells: { columns: { row: true, col: true, digit: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
