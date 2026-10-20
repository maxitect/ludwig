import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { circle9AttemptCircles, circle9Numbers } from "./tables";

const coordinate = (schema: z.ZodNumber) => schema.min(0).max(8);

const numberSelect = createSelectSchema(circle9Numbers, {
  row: coordinate,
  col: coordinate,
  digit: (schema) => schema.min(1).max(9),
});
const circleSelect = createSelectSchema(circle9AttemptCircles, {
  row: coordinate,
  col: coordinate,
});

const placed = numberSelect.pick({ row: true, col: true, digit: true });
const cell = circleSelect.pick({ row: true, col: true });

/** The numbers on the grid. Nothing is stored for the solution. */
export const payloadSchema = z
  .object({ numbers: z.array(placed.strict()) })
  .strict();

/** The nine circled numbers, solved from the grid. */
export const solutionSchema = z.array(cell);

export const answerSchema = z.object({ circles: z.array(cell) });

/** A circle on an empty cell, or one that clashes with another in digit, row, column or box. Computed from the answer, never from the solution. */
export const wrongPartSchema = cell;

export const attemptSchema = z.object({ circles: z.array(cell) });

/** The grid is nine strings of nine characters: a digit 1 to 9, or a full stop for an empty cell. */
export const contentSchema = z.object({
  grid: z.array(z.string().regex(/^[1-9.]{9}$/)).length(9),
});

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
