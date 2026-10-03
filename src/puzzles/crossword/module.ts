import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import { check, checkCell, revealCell } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import * as schema from "./schema";
import {
  crosswordAttemptCells,
  crosswordAttempts,
  crosswordCells,
  crosswordClueSegments,
  crosswordClues,
  crosswordPuzzles,
} from "./tables";
import { verifyCrossword } from "./verify";

export const crosswordModule = {
  schema,
  meta: { key: "crossword" },
  load,
  loadSolution,
  check,
  checkCell,
  revealCell,
  verify: verifyCrossword,
  async upsertContent(tx, puzzleId, { cells, clues, ...puzzle }) {
    await tx
      .insert(crosswordPuzzles)
      .values({ ...puzzle, puzzleId })
      .onConflictDoUpdate({
        target: crosswordPuzzles.puzzleId,
        set: { style: puzzle.style, rows: puzzle.rows, cols: puzzle.cols },
      });
    await tx
      .insert(crosswordCells)
      .values(cells.map((cell) => ({ ...cell, puzzleId })))
      .onConflictDoUpdate({
        target: [
          crosswordCells.puzzleId,
          crosswordCells.row,
          crosswordCells.col,
        ],
        set: { letter: sql`excluded.letter` },
      });
    const tuple = (...values: (string | number)[]) =>
      sql`(${sql.join(values, sql`, `)})`;
    await tx.delete(crosswordClues).where(
      and(
        eq(crosswordClues.puzzleId, puzzleId),
        sql`(${crosswordClues.direction}::text, ${crosswordClues.row}, ${crosswordClues.col}) not in (${sql.join(
          clues.map(({ direction, row, col }) => tuple(direction, row, col)),
          sql`, `,
        )})`,
      ),
    );
    await tx.delete(crosswordCells).where(
      and(
        eq(crosswordCells.puzzleId, puzzleId),
        sql`(${crosswordCells.row}, ${crosswordCells.col}) not in (${sql.join(
          cells.map(({ row, col }) => tuple(row, col)),
          sql`, `,
        )})`,
      ),
    );
    await tx
      .insert(crosswordClues)
      .values(
        clues.map(({ direction, row, col, clueText }) => ({
          puzzleId,
          direction,
          row,
          col,
          clueText,
        })),
      )
      .onConflictDoUpdate({
        target: [
          crosswordClues.puzzleId,
          crosswordClues.direction,
          crosswordClues.row,
          crosswordClues.col,
        ],
        set: { clueText: sql`excluded.clue_text` },
      });
    await tx
      .delete(crosswordClueSegments)
      .where(eq(crosswordClueSegments.puzzleId, puzzleId));
    await tx.insert(crosswordClueSegments).values(
      clues.flatMap(({ segments, direction, row, col }) =>
        segments.map((length, position) => ({
          puzzleId,
          direction,
          row,
          col,
          position,
          length,
        })),
      ),
    );
  },
  async replaceAttemptState(tx, attemptId, { cells }) {
    await tx
      .delete(crosswordAttempts)
      .where(eq(crosswordAttempts.attemptId, attemptId));
    await tx.insert(crosswordAttempts).values({ attemptId });
    if (!cells.length) return;
    await tx
      .insert(crosswordAttemptCells)
      .values(cells.map((cell) => ({ ...cell, attemptId })));
  },
  async clearAttemptState(attemptId) {
    await db
      .delete(crosswordAttempts)
      .where(eq(crosswordAttempts.attemptId, attemptId));
  },
  async loadAttemptState(attemptId) {
    const attempt = await db.query.crosswordAttempts.findFirst({
      where: { attemptId },
      columns: {},
      with: { cells: { columns: { row: true, col: true, letter: true } } },
    });
    return attempt ? schema.attemptSchema.parse(attempt) : null;
  },
} satisfies PuzzleTypeModule<typeof schema, schema.Solution>;
