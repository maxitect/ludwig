import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  kakuroAttemptCells,
  kakuroCells,
  kakuroPuzzles,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(13);
const digit = (schema: z.ZodNumber) => schema.min(1).max(9);
const dimension = (schema: z.ZodNumber) => schema.min(5).max(14);

const puzzleSelect = createSelectSchema(kakuroPuzzles, {
  rows: dimension,
  cols: dimension,
});
const puzzleInsert = createInsertSchema(kakuroPuzzles, {
  rows: dimension,
  cols: dimension,
});
const cellSelect = createSelectSchema(kakuroCells, {
  row: coordinate,
  col: coordinate,
  digit,
});
const cellInsert = createInsertSchema(kakuroCells, {
  row: coordinate,
  col: coordinate,
  digit,
});
const attemptCellSelect = createSelectSchema(kakuroAttemptCells, {
  row: coordinate,
  col: coordinate,
  digit,
});

const entered = attemptCellSelect.pick({ row: true, col: true, digit: true });
const white = cellSelect.pick({ row: true, col: true });

/** The white cells with their digits. */
export const solutionSchema = z.array(
  cellSelect.pick({ row: true, col: true, digit: true }),
);

/**
 * A clue sits in the black cell before its run (`row`, `col`) and reads along `direction`.
 * Derived from the stored digits; the digits themselves never leave the server.
 */
export const clueSchema = z.object({
  direction: z.enum(["across", "down"]),
  row: white.shape.row,
  col: white.shape.col,
  length: z.number().int().min(2).max(9),
  sum: z.number().int().min(3).max(45),
});

export const payloadSchema = z.object({
  rows: puzzleSelect.shape.rows,
  cols: puzzleSelect.shape.cols,
  cells: z.array(white.strict()),
  clues: z.array(clueSchema.strict()),
});

export const answerSchema = z.object({ cells: z.array(entered) });

export const attemptSchema = z.object({ cells: z.array(entered) });

/** Coordinates must fit the puzzle's own size, which a CHECK cannot see. */
export const contentSchema = z
  .object({
    rows: puzzleInsert.shape.rows,
    cols: puzzleInsert.shape.cols,
    cells: z
      .array(cellInsert.pick({ row: true, col: true, digit: true }))
      .min(4),
  })
  .superRefine(({ rows, cols, cells }, ctx) => {
    cells.forEach(({ row, col }, index) => {
      if (row >= rows || col >= cols) {
        ctx.addIssue({
          code: "custom",
          path: ["cells", index],
          message: `cell does not fit a ${rows} by ${cols} grid`,
        });
      }
    });
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Clue = z.infer<typeof clueSchema>;
