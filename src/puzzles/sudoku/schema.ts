import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  sudokuAttemptCells,
  sudokuAttemptNotes,
  sudokuGivens,
} from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(8);
const digit = (schema: z.ZodNumber) => schema.min(1).max(9);

const givenSelect = createSelectSchema(sudokuGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const givenInsert = createInsertSchema(sudokuGivens, {
  row: coordinate,
  col: coordinate,
  digit,
});
const cellSelect = createSelectSchema(sudokuAttemptCells, {
  row: coordinate,
  col: coordinate,
  digit,
});
const noteSelect = createSelectSchema(sudokuAttemptNotes, {
  row: coordinate,
  col: coordinate,
  digit,
});

const given = givenSelect.pick({ row: true, col: true, digit: true });
const entered = cellSelect.pick({ row: true, col: true, digit: true });
const noted = noteSelect.pick({ row: true, col: true, digit: true });

/** The solved grid, derived from the givens: one entry per cell. */
export const solutionSchema = z.array(entered).length(81);

export const payloadSchema = z.object({ givens: z.array(given.strict()) });

export const answerSchema = z.object({ cells: z.array(entered).length(81) });

export const attemptSchema = z.object({
  cells: z.array(entered),
  notes: z.array(noted),
});

export const contentSchema = z.object({
  givens: z.array(givenInsert.pick({ row: true, col: true, digit: true })),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Given = z.infer<typeof given>;
