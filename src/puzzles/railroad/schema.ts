import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { endOnEdge } from "./engine";
import {
  railroadAttemptCrosses,
  railroadAttemptPieces,
  railroadGivenPieces,
  railroadPuzzles,
  railroadRowCounts,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(9);
const extent = (schema: z.ZodNumber) => schema.min(4).max(10);
const count = (schema: z.ZodNumber) => schema.min(0).max(10);

const puzzleSelect = createSelectSchema(railroadPuzzles, {
  rows: extent,
  cols: extent,
  entryRow: coordinate,
  entryCol: coordinate,
  exitRow: coordinate,
  exitCol: coordinate,
});
const puzzleInsert = createInsertSchema(railroadPuzzles, {
  rows: extent,
  cols: extent,
  entryRow: coordinate,
  entryCol: coordinate,
  exitRow: coordinate,
  exitCol: coordinate,
});
const countSelect = createSelectSchema(railroadRowCounts, { count });
const givenSelect = createSelectSchema(railroadGivenPieces, {
  row: coordinate,
  col: coordinate,
});
const attemptPieceSelect = createSelectSchema(railroadAttemptPieces, {
  row: coordinate,
  col: coordinate,
});
const crossSelect = createSelectSchema(railroadAttemptCrosses, {
  row: coordinate,
  col: coordinate,
});

/** The compass sides a track end can sit on: `compass8` narrowed to the four edges. */
export const sideSchema = puzzleSelect.shape.entrySide.extract([
  "n",
  "e",
  "s",
  "w",
]);

export const pieceSchema = givenSelect.shape.piece;

const cell = givenSelect.pick({ row: true, col: true });
const placed = givenSelect.pick({ row: true, col: true, piece: true });
const end = cell.extend({ side: sideSchema });

const counts = z.array(countSelect.shape.count);

const shape = {
  ...puzzleSelect.pick({ rows: true, cols: true }).shape,
  entry: end,
  exit: end,
  rowCounts: counts,
  colCounts: counts,
  given: z.array(placed),
};

/** The size, the two ends, the row and column counts and the given pieces. The track is not stored. */
export const payloadSchema = z.object(shape).strict();

/** The track, solved from the clues: every piece on the one path. */
export const solutionSchema = z.array(placed);

/** The pieces the player laid, the given ones included. Crosses are notes and are not sent. */
export const answerSchema = z.object({ pieces: z.array(placed) });

/** A cell that is off the track, breaks it, or holds a piece the rules reject. */
export const wrongPartSchema = cell;

export const attemptSchema = z.object({
  pieces: z.array(attemptPieceSelect.pick({ row: true, col: true, piece: true })),
  crosses: z.array(crossSelect.pick({ row: true, col: true })),
});

/**
 * The written puzzle. Counts are listed by row and by column. Each end must sit on the edge its
 * side names and inside the grid, and every count and given piece must lie in the grid.
 */
export const contentSchema = z
  .object({
    ...puzzleInsert.pick({ rows: true, cols: true }).shape,
    entry: end,
    exit: end,
    rowCounts: counts,
    colCounts: counts,
    given: z.array(placed),
  })
  .superRefine((puzzle, ctx) => {
    const problem = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (puzzle.rowCounts.length !== puzzle.rows) {
      problem(`there are ${puzzle.rowCounts.length} row counts, not ${puzzle.rows}`);
    }
    if (puzzle.colCounts.length !== puzzle.cols) {
      problem(`there are ${puzzle.colCounts.length} column counts, not ${puzzle.cols}`);
    }
    for (const name of ["entry", "exit"] as const) {
      if (!endOnEdge(puzzle[name], puzzle.rows, puzzle.cols)) {
        problem(`the ${name} is not on the ${puzzle[name].side} edge of the grid`);
      }
    }
    for (const { row, col } of puzzle.given) {
      if (row >= puzzle.rows || col >= puzzle.cols) {
        problem(`the given piece at row ${row}, column ${col} is outside the grid`);
      }
    }
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Piece = z.infer<typeof pieceSchema>;
export type Side = z.infer<typeof sideSchema>;
export type Cell = z.infer<typeof cell>;
export type Placed = z.infer<typeof placed>;
