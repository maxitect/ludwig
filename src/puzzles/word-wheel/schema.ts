import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";
import { wordWheelAttemptWords, wordWheelPuzzles } from "./tables";

const MAX_FOUND = 2000;

const targetWord = (schema: z.ZodString) => schema.regex(/^[a-z]{9}$/);
const dictionaryWord = (schema: z.ZodString) => schema.regex(/^[a-z]{3,9}$/);
const letter = z.string().regex(/^[a-z]$/);

const puzzleSelect = createSelectSchema(wordWheelPuzzles, { targetWord });
const puzzleInsert = createInsertSchema(wordWheelPuzzles, {
  targetWord,
  centrePosition: (schema) => schema.min(0).max(8),
  scrambleSeed: (schema) => schema.min(0),
  minLength: (schema) => schema.min(4).max(5),
});
const attemptWordSelect = createSelectSchema(wordWheelAttemptWords, {
  word: dictionaryWord,
});

export const solutionSchema = puzzleSelect.shape.targetWord;

/** The wheel and the rating thresholds, which are derived from the dictionary on load. */
export const payloadSchema = z.object({
  ...puzzleSelect.pick({ puzzleId: true, minLength: true }).shape,
  centre: letter,
  rim: z.array(letter).length(8),
  thresholds: z.object({
    average: z.number().int().nonnegative(),
    good: z.number().int().nonnegative(),
    genius: z.number().int().nonnegative(),
  }),
});

/** The target word, sent once the player has found it. */
export const answerSchema = z.object({ word: puzzleSelect.shape.targetWord });

export const attemptSchema = z.object({
  words: z.array(attemptWordSelect.shape.word).max(MAX_FOUND),
});

export const contentSchema = puzzleInsert.pick({
  targetWord: true,
  centrePosition: true,
  scrambleSeed: true,
  minLength: true,
});

export type Solution = z.infer<typeof solutionSchema>;
export type Payload = z.infer<typeof payloadSchema>;
export type Answer = z.infer<typeof answerSchema>;
export type AttemptState = z.infer<typeof attemptSchema>;
export type Content = z.infer<typeof contentSchema>;
