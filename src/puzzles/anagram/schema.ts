import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { anagramAttempts, anagramPuzzles } from "./tables";

const phrase = (schema: z.ZodString) =>
  schema.regex(/^[a-z]+( [a-z]+)*$/).max(40);
const letters = (schema: z.ZodString) => schema.regex(/^[a-z]*$/).max(40);

const puzzleSelect = createSelectSchema(anagramPuzzles, { answer: phrase });
const puzzleInsert = createInsertSchema(anagramPuzzles, {
  answer: phrase,
  scrambleSeed: (schema) => schema.min(0),
});
const attemptSelect = createSelectSchema(anagramAttempts, { answer: letters });

export const solutionSchema = puzzleSelect.shape.answer;

export const payloadSchema = z.object({
  ...puzzleSelect.pick({ definitionHint: true }).shape,
  tiles: z.array(z.string().length(1)),
  wordLengths: z.array(z.number().int().positive()),
});

export const answerSchema = z.object({
  answer: attemptSelect.shape.answer.unwrap().min(1),
});

export const attemptSchema = attemptSelect.pick({ answer: true });

export const contentSchema = puzzleInsert.pick({
  answer: true,
  definitionHint: true,
  scrambleSeed: true,
});

export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
