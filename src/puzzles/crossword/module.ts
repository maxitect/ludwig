import { eq } from "drizzle-orm";
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
  async insertContent(tx, puzzleId, { cells, clues, ...puzzle }) {
    await tx.insert(crosswordPuzzles).values({ ...puzzle, puzzleId });
    await tx
      .insert(crosswordCells)
      .values(cells.map((cell) => ({ ...cell, puzzleId })));
    await tx.insert(crosswordClues).values(
      clues.map(({ direction, row, col, clueText }) => ({
        puzzleId,
        direction,
        row,
        col,
        clueText,
      })),
    );
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
