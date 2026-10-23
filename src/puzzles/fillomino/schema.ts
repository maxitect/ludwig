import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  fillominoAttemptCells,
  fillominoGivens,
  fillominoPuzzles,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(11);
const digit = (schema: z.ZodNumber) => schema.min(1).max(9);
const dimension = (schema: z.ZodNumber) => schema.min(5).max(12);

const puzzleSelect = createSelectSchema(fillominoPuzzles, {
  rows: dimension,
  cols: dimension,
});
const puzzleInsert = createInsertSchema(fillominoPuzzles, {
  rows: dimension,
  cols: dimension,
});
const givenSelect = createSelectSchema(fillominoGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const givenInsert = createInsertSchema(fillominoGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const attemptCellSelect = createSelectSchema(fillominoAttemptCells, {
  row: coordinate,
  col: coordinate,
  digit,
});

const given = givenSelect.pick({ row: true, col: true, digit: true });
const entered = attemptCellSelect.pick({ row: true, col: true, digit: true });

/** The solved grid, derived from the puzzle: one entry per cell. */
export const solutionSchema = z.array(entered).min(25).max(144);

export const payloadSchema = z.object({
  rows: puzzleSelect.shape.rows,
  cols: puzzleSelect.shape.cols,
  givens: z.array(given.strict()),
});

export const answerSchema = z.object({
  cells: z.array(entered).min(25).max(144),
});

/** A cell in an area of the wrong size. Computed from the player's answer, never from the solution. */
export const wrongPartSchema = entered.pick({ row: true, col: true });

export const attemptSchema = z.object({ cells: z.array(entered) });

/** Coordinates must fit the puzzle's own size, which a CHECK cannot see. */
export const contentSchema = z
  .object({
    rows: puzzleInsert.shape.rows,
    cols: puzzleInsert.shape.cols,
    givens: z.array(givenInsert.pick({ row: true, col: true, digit: true })),
  })
  .superRefine(({ rows, cols, givens }, ctx) => {
    givens.forEach(({ row, col }, index) => {
      if (row >= rows || col >= cols) {
        ctx.addIssue({
          code: "custom",
          path: ["givens", index],
          message: `given does not fit a ${rows} by ${cols} grid`,
        });
      }
    });
  });

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Given = z.infer<typeof given>;
