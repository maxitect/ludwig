import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  sudokuAttemptCells,
  sudokuAttemptNotes,
  sudokuAttempts,
  sudokuGivens,
  sudokuPuzzles,
} from "./tables";
import { verifySudoku } from "./verify";

export const sudokuModule = {
  schema,
  meta: { key: "sudoku" },
  load,
  loadSolution,
  check,
  verify: verifySudoku,
  async upsertContent(tx, puzzleId, { givens }) {
    await tx.insert(sudokuPuzzles).values({ puzzleId }).onConflictDoNothing();
    await tx.delete(sudokuGivens).where(
      and(
        eq(sudokuGivens.puzzleId, puzzleId),
        sql`(${sudokuGivens.row}, ${sudokuGivens.col}) not in (${sql.join(
          givens.map(({ row, col }) => sql`(${row}, ${col})`),
          sql`, `,
        )})`,
      ),
    );
    await tx
      .insert(sudokuGivens)
      .values(givens.map((given) => ({ ...given, puzzleId })))
      .onConflictDoUpdate({
        target: [sudokuGivens.puzzleId, sudokuGivens.row, sudokuGivens.col],
        set: { digit: sql`excluded.digit` },
      });
  },
  async replaceAttemptState(tx, attemptId, { cells, notes }) {
    await tx
      .delete(sudokuAttempts)
      .where(eq(sudokuAttempts.attemptId, attemptId));
    await tx.insert(sudokuAttempts).values({ attemptId });
    if (cells.length) {
      await tx
        .insert(sudokuAttemptCells)
        .values(cells.map((cell) => ({ ...cell, attemptId })));
    }
    if (notes.length) {
      await tx
        .insert(sudokuAttemptNotes)
        .values(notes.map((note) => ({ ...note, attemptId })));
    }
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(sudokuAttempts)
      .where(eq(sudokuAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.sudokuAttempts.findFirst({
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
