import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  kakuroAttemptCells,
  kakuroAttempts,
  kakuroCells,
  kakuroPuzzles,
} from "./tables";
import { verifyKakuro } from "./verify";

export const kakuroModule = {
  schema,
  meta: { key: "kakuro" },
  load,
  loadSolution,
  check,
  verify: verifyKakuro,
  async upsertContent(tx, puzzleId, { rows, cols, cells }) {
    await tx
      .insert(kakuroPuzzles)
      .values({ puzzleId, rows, cols })
      .onConflictDoUpdate({
        target: kakuroPuzzles.puzzleId,
        set: { rows: sql`excluded.rows`, cols: sql`excluded.cols` },
      });
    await tx.delete(kakuroCells).where(
      and(
        eq(kakuroCells.puzzleId, puzzleId),
        sql`(${kakuroCells.row}, ${kakuroCells.col}) not in (${sql.join(
          cells.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`,
      ),
    );
    await tx
      .insert(kakuroCells)
      .values(cells.map((cell) => ({ ...cell, puzzleId })))
      .onConflictDoUpdate({
        target: [kakuroCells.puzzleId, kakuroCells.row, kakuroCells.col],
        set: { digit: sql`excluded.digit` },
      });
  },
  async replaceAttemptState(tx, attemptId, { cells }) {
    await tx
      .delete(kakuroAttempts)
      .where(eq(kakuroAttempts.attemptId, attemptId));
    await tx.insert(kakuroAttempts).values({ attemptId });
    if (!cells.length) return;
    await tx
      .insert(kakuroAttemptCells)
      .values(cells.map((cell) => ({ ...cell, attemptId })));
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(kakuroAttempts)
      .where(eq(kakuroAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.kakuroAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { cells: { columns: { row: true, col: true, digit: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
