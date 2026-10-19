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
  sudokuCageCells,
  sudokuCages,
  sudokuGivens,
  sudokuPuzzles,
  sudokuRegionCells,
  sudokuRegionSets,
  sudokuXvMarks,
  sudokuXvSets,
} from "./tables";
import { verifySudoku } from "./verify";

export const sudokuModule = {
  schema,
  meta: { key: "sudoku" },
  load,
  loadSolution,
  check,
  verify: verifySudoku,
  async upsertContent(tx, puzzleId, { givens, regions, cages, xv }) {
    await tx.insert(sudokuPuzzles).values({ puzzleId }).onConflictDoNothing();
    await tx.delete(sudokuGivens).where(
      and(
        eq(sudokuGivens.puzzleId, puzzleId),
        givens.length
          ? sql`(${sudokuGivens.row}, ${sudokuGivens.col}) not in (${sql.join(
              givens.map(({ row, col }) => sql`(${row}, ${col})`),
              sql`, `,
            )})`
          : undefined,
      ),
    );
    if (givens.length) {
      await tx
        .insert(sudokuGivens)
        .values(givens.map((given) => ({ ...given, puzzleId })))
        .onConflictDoUpdate({
          target: [sudokuGivens.puzzleId, sudokuGivens.row, sudokuGivens.col],
          set: { digit: sql`excluded.digit` },
        });
    }
    if (regions) {
      await tx
        .insert(sudokuRegionSets)
        .values({ puzzleId, kind: regions.kind })
        .onConflictDoUpdate({
          target: sudokuRegionSets.puzzleId,
          set: { kind: regions.kind },
        });
      await tx
        .insert(sudokuRegionCells)
        .values(regions.cells.map((cell) => ({ ...cell, puzzleId })))
        .onConflictDoUpdate({
          target: [
            sudokuRegionCells.puzzleId,
            sudokuRegionCells.row,
            sudokuRegionCells.col,
          ],
          set: { region: sql`excluded.region` },
        });
    } else {
      await tx
        .delete(sudokuRegionSets)
        .where(eq(sudokuRegionSets.puzzleId, puzzleId));
    }

    await tx.delete(sudokuCages).where(eq(sudokuCages.puzzleId, puzzleId));
    if (cages?.length) {
      await tx
        .insert(sudokuCages)
        .values(cages.map(({ sum }, cage) => ({ puzzleId, cage, sum })));
      await tx.insert(sudokuCageCells).values(
        cages.flatMap(({ cells }, cage) =>
          cells.map((cell) => ({ ...cell, puzzleId, cage })),
        ),
      );
    }

    await tx.delete(sudokuXvSets).where(eq(sudokuXvSets.puzzleId, puzzleId));
    if (xv) {
      await tx.insert(sudokuXvSets).values({ puzzleId });
      if (xv.marks.length) {
        await tx
          .insert(sudokuXvMarks)
          .values(xv.marks.map((mark) => ({ ...mark, puzzleId })));
      }
    }
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
