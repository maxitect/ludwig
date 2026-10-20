import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  nonogramAttemptMarks,
  nonogramCells,
  nonogramPuzzles,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(24);
const extent = (schema: z.ZodNumber) => schema.min(5).max(25);

const puzzleSelect = createSelectSchema(nonogramPuzzles, {
  rows: extent,
  cols: extent,
});
const puzzleInsert = createInsertSchema(nonogramPuzzles, {
  rows: extent,
  cols: extent,
});
const cellSelect = createSelectSchema(nonogramCells, {
  row: coordinate,
  col: coordinate,
});
const markSelect = createSelectSchema(nonogramAttemptMarks, {
  row: coordinate,
  col: coordinate,
});

const cell = cellSelect.pick({ row: true, col: true });
const marked = markSelect.pick({ row: true, col: true, mark: true });

/** A line's clue: the lengths of its runs of shaded cells, in order. A line with no shaded cell has no runs. */
const clue = z.array(z.number().int().min(1).max(25));

/** The grid's size and its clues, derived from the picture. Neither the cells nor the caption leave the server. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({ rows: true, cols: true }).shape,
    rowClues: z.array(clue),
    colClues: z.array(clue),
  })
  .strict();

/** The picture and its caption, read only by `check` and the page after a solve. */
export const solutionSchema = z.object({
  cells: z.array(cell),
  caption: puzzleSelect.shape.caption,
});

export const answerSchema = z.object({ shaded: z.array(cell) });

export const attemptSchema = z.object({ marks: z.array(marked) });

/** The picture is written as one string per row, `#` for a shaded cell and `.` for an empty one. */
export const contentSchema = puzzleInsert
  .pick({ rows: true, cols: true, caption: true })
  .extend({
    grid: z
      .array(z.string().regex(/^[#.]{5,25}$/))
      .min(5)
      .max(25),
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Mark = AttemptState["marks"][number]["mark"];
export type Cell = z.infer<typeof cell>;
