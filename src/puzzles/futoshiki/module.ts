import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  futoshikiAttemptCells,
  futoshikiAttemptNotes,
  futoshikiAttempts,
  futoshikiGivens,
  futoshikiInequalities,
  futoshikiPuzzles,
} from "./tables";
import { verifyFutoshiki } from "./verify";

export const futoshikiModule = {
  schema,
  meta: { key: "futoshiki" },
  load,
  loadSolution,
  check,
  verify: verifyFutoshiki,
  async upsertContent(tx, puzzleId, { size, givens, inequalities }) {
    await tx
      .insert(futoshikiPuzzles)
      .values({ puzzleId, size })
      .onConflictDoUpdate({
        target: futoshikiPuzzles.puzzleId,
        set: { size: sql`excluded.size` },
      });

    const keptGivens = givens.length
      ? sql`(${futoshikiGivens.row}, ${futoshikiGivens.col}) not in (${sql.join(
          givens.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`
      : undefined;
    await tx
      .delete(futoshikiGivens)
      .where(and(eq(futoshikiGivens.puzzleId, puzzleId), keptGivens));
    if (givens.length) {
      await tx
        .insert(futoshikiGivens)
        .values(givens.map((given) => ({ ...given, puzzleId })))
        .onConflictDoUpdate({
          target: [
            futoshikiGivens.puzzleId,
            futoshikiGivens.row,
            futoshikiGivens.col,
          ],
          set: { digit: sql`excluded.digit` },
        });
    }

    const keptInequalities = inequalities.length
      ? sql`(${futoshikiInequalities.row}, ${futoshikiInequalities.col}, ${futoshikiInequalities.direction}) not in (${sql.join(
          inequalities.map(
            ({ row, col, direction }) =>
              sql`(${row}, ${col}, ${direction}::ineq_direction)`,
          ),
          sql`, `,
        )})`
      : undefined;
    await tx
      .delete(futoshikiInequalities)
      .where(
        and(eq(futoshikiInequalities.puzzleId, puzzleId), keptInequalities),
      );
    if (inequalities.length) {
      await tx
        .insert(futoshikiInequalities)
        .values(inequalities.map((inequality) => ({ ...inequality, puzzleId })))
        .onConflictDoUpdate({
          target: [
            futoshikiInequalities.puzzleId,
            futoshikiInequalities.row,
            futoshikiInequalities.col,
            futoshikiInequalities.direction,
          ],
          set: { relation: sql`excluded.relation` },
        });
    }
  },
  async replaceAttemptState(tx, attemptId, { cells, notes }) {
    await tx
      .delete(futoshikiAttempts)
      .where(eq(futoshikiAttempts.attemptId, attemptId));
    await tx.insert(futoshikiAttempts).values({ attemptId });
    if (cells.length) {
      await tx
        .insert(futoshikiAttemptCells)
        .values(cells.map((cell) => ({ ...cell, attemptId })));
    }
    if (notes.length) {
      await tx
        .insert(futoshikiAttemptNotes)
        .values(notes.map((note) => ({ ...note, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(futoshikiAttempts)
      .where(eq(futoshikiAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.futoshikiAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: {
        cells: { columns: { row: true, col: true, digit: true } },
        notes: { columns: { row: true, col: true, digit: true } },
      },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
