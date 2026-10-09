import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import {
  napkinMathsAttempts,
  napkinMathsLines,
  napkinMathsPuzzles,
} from "./tables";

const MIN_LINES = 2;
const MAX_LINES = 12;
const decimal = (schema: z.ZodString) =>
  schema.regex(/^-?\d{1,12}(\.\d{1,6})?$/, "Enter a number such as 42 or 3.5");

const puzzleSelect = createSelectSchema(napkinMathsPuzzles, { answer: decimal });
const puzzleInsert = createInsertSchema(napkinMathsPuzzles, { answer: decimal });
const lineInsert = createInsertSchema(napkinMathsLines);
const attemptSelect = createSelectSchema(napkinMathsAttempts, {
  answer: decimal,
});

export const solutionSchema = puzzleSelect.shape.answer;

/** The question and the napkin lines. The answer is (S) and stays on the server. */
export const payloadSchema = z
  .object({
    ...puzzleSelect.pick({ questionText: true }).shape,
    lines: z.array(z.string()),
  })
  .strict();

/** The decimal the player typed, as text. It is parsed, never evaluated. */
export const answerSchema = z.object({
  answer: z.string().trim().pipe(decimal(z.string())),
});

export const attemptSchema = attemptSelect.pick({ answer: true });

/** The lines are in display order and numbered by their index. */
export const contentSchema = z
  .object({
    ...puzzleInsert.pick({ questionText: true, answer: true }).shape,
    lines: z.array(lineInsert.shape.content).min(MIN_LINES).max(MAX_LINES),
  })
  .strict();

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
