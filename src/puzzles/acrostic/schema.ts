import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { acrosticAttempts, acrosticLines, acrosticPuzzles } from "./tables";

const MAX_LINES = 30;
const MAX_ANSWER = 80;

const line = (schema: z.ZodString) => schema.min(1).max(300).regex(/\p{L}/u);

const puzzleInsert = createInsertSchema(acrosticPuzzles);
const lineSelect = createSelectSchema(acrosticLines, { content: line });
const attemptSelect = createSelectSchema(acrosticAttempts, {
  answer: (schema) => schema.max(MAX_ANSWER),
});

const lines = z.array(lineSelect.shape.content).min(1).max(MAX_LINES);

/** The lines and the rule's display label. The message and the rule key stay on the server. */
export const payloadSchema = z.object({
  ruleLabel: z.string().min(1),
  lines,
});

/** The derived message, upper-case A to Z. */
export const solutionSchema = z.string().regex(/^[A-Z]+$/);

export const answerSchema = z.object({
  answer: attemptSelect.shape.answer.unwrap().min(1),
});

export const attemptSchema = attemptSelect.pick({ answer: true });

export const contentSchema = puzzleInsert.pick({ rule: true }).extend({ lines });

export type Payload = z.infer<typeof payloadSchema>;
export type Solution = z.infer<typeof solutionSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
